<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { BoardCoordinates, boardSize, GameBoard } from '../logic/GameBoard'
import MoveHint from './MoveHint.vue'
import { Tile } from '../models/Tile'
import BoardTile from './BoardTile.vue'
import { BoardAnalyser, MoveAnalysis, MoveType, PossibleMove } from '../logic/BoardAnalyser'
import Team from './Team.vue'
import { MovesMaker, StepResult } from '../logic/MovesMaker'
import { tileFromString, tileToString } from '../utils/transformers'
import { TileView } from '../models/TileView'
import SelectTile from './SelectTile.vue'
import { generateRandomKey } from '../utils/utils'
import { Card, getFrozenColors } from '../models/Cards'

export interface BoardViewConfig {
  tilesList: Array<string>
}

let setup = defineProps<BoardViewConfig>()
let tilesList: Array<string> = setup.tilesList

type BoardView = Array<Array<TileView>>
let board: BoardView = reactive([])
const moveMessage = ref('')
var prevMap: BoardView = []
interface SuggestedMoves {
  moves: Array<MoveAnalysis>
}
let suggestedMoves: SuggestedMoves = reactive({moves: []})
let myCards: Array<Card> = reactive([])
let opponentCards: Array<Card> = reactive([])

for (let i = 0; i < boardSize; i++) {
  board[i] = []
  for (let j = 0; j < boardSize; j++) {
    board[i][j] = new TileView(Tile.empty)
  }
}
reloadMapFromList(tilesList)

watch(tilesList, async (newList, oldList) => {
  console.log("in board view tilesList watch")
  reloadMapFromList(newList)
  analysePossibleMoves()
})

const animation = {
  fadeTime: 1000,
  pauseTime: 200
}

let selectTileView = reactive({isActive: false, coords: [0, 0]})

var selectedTile: [number, number] | null = null
function ballClicked(i: number, j: number) {
  if (board[i][j].tileClass == 'UN') {
    selectTileView.isActive = true
    selectTileView.coords = [i, j]
  } else {
    if (selectedTile == null) {
      selectedTile = [i, j]
      board[i][j].isSelected = true
    } else {
      board[selectedTile[0]][selectedTile[1]].isSelected = false
      let res = changeTiles(selectedTile, [i, j])
      moveMessage.value = res.message
      selectedTile = null
    }
  }
}

function tileSelected(t: Tile) {
  let [i, j] = selectTileView.coords
  board[i][j].tileClass = tileToString(t)
  selectTileView.isActive = false
}

interface MoveResponse {
  message: string
}

function changeTiles(coord1: BoardCoordinates, coord2: BoardCoordinates): MoveResponse {
  saveStateBeforeChange()
  let result = new MovesMaker(boardToGameBoard(board), getFrozenColors(myCards)).moveTiles(coord1, coord2)
  console.log(result)
  if (typeof result === 'string') {
    return { message: result }
  }
  if (!result.hasMatch) {
    rollBackToPrev()
    return { message: "no matches in the move" }
  }
  // match found, apply changes
  saveStateBeforeChange()
  setBoard(gameBoardToBoard(result.mapAfterMove))
  animateSteps(result.steps)
  suggestedMoves.moves = []
  return { message: "move done" }
}

function reColor(c: Card) {
  saveStateBeforeChange()
  console.log(c)
  let result = new MovesMaker(boardToGameBoard(board), getFrozenColors(myCards)).paintOver(c.transformations.map(([from, to]) => [from[0], to]))
  if (typeof result === 'string') {
    return { message: result }
  }
  setBoard(gameBoardToBoard(result.mapAfterMove))
  animateSteps(result.steps)
  suggestedMoves.moves = []
}

function animateSteps(steps: Array<StepResult>) {
  if (steps.length == 0) {
    analysePossibleMoves()
    return
  }
  let currentStep = steps[0]
  for (let i in currentStep.matches) {
    let match = currentStep.matches[i]
    modifyTiles(match.tiles, (t) => t.fade = true)
  }
  modifyTiles(currentStep.blown.map(([tile, c]) => c) , (t) => t.fade = true)
  setTimeout(() => {setBoard(gameBoardToBoard(currentStep.resultMap))}, animation.fadeTime);
  if (steps.length > 0) {
    setTimeout(() => animateSteps(steps.slice(1, steps.length)), animation.fadeTime + animation.pauseTime);
  }
}

function modifyTiles(coords: Array<BoardCoordinates>, valueF: (t: TileView) => void) {
  for (let t in coords) {
    let [i, j] = coords[t]
    valueF(board[i][j])
  }
}

function cloneMap() {
  const cloned: BoardView = []
  for (let i in board) {
      cloned[i] = []
      for (var j in board[i]) {
          cloned[i][j] = board[i][j]
      }
  }
  return cloned
}

function saveStateBeforeChange() {
    prevMap = cloneMap()
}

function rollBackToPrev() {
  if (prevMap.length > 0) {
    setBoard(prevMap)
    analysePossibleMoves()
  }
}

function boardToGameBoard(b: Array<Array<TileView>>): GameBoard {
  let tilesBoard = b.map((line) => line.map((elem) => tileFromString(elem.tileClass)))
  return new GameBoard().withBoard(tilesBoard)
}

function gameBoardToBoard(b: GameBoard): Array<Array<TileView>> {
  return b.board.map((line) => line.map((elem) => new TileView(elem)))
}

function setBoard(newMap: BoardView) {
  for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
          board[i][j] = newMap[i][j]
      }
  }
}

function reloadMapFromList(newList: Array<string>) {
  var n = 0
  for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
          board[i][j] = new TileView(tileFromString(newList[n]))
          n++
      }
  }
  suggestedMoves.moves = []
}

function analysePossibleMoves() {
  let res = new BoardAnalyser(boardToGameBoard(board), myCards, opponentCards).analyseBoard()
  suggestedMoves.moves.splice(0, suggestedMoves.moves.length, ...res)
}

function highlightMove(move: PossibleMove) {
  if (move.moveType == MoveType.MoveTiles) {
    let [[x1, y1], [x2, y2]] = move.coords!
    board[x1][y1].isHighlighted = true
    board[x2][y2].isHighlighted = true
  } else {
    move.cardPlayed!.isHighlighted = true
    if (move.moveResult.steps.length > 0) {
      let coords: Array<BoardCoordinates> = move.moveResult.steps[0].matches.flatMap(m => m.tiles)
      for (let [i, j] of coords) {
        board[i][j].isHighlighted = true
      }
    }
  }
}

function highlightPaint(c: Card) {
  if (c.transformations.length == 0) return
  let transformations: Array<[Tile, Tile]> = c.transformations.map(([from, to]) => [from[0], to])
  let result = new MovesMaker(boardToGameBoard(board), getFrozenColors(myCards)).paintOver(transformations)
  if (typeof result === 'string') return
  if (result.steps.length > 0) {
    let coords: Array<BoardCoordinates> = result.steps[0].matches.flatMap(m => m.tiles)
    for (let [i, j] of coords) {
      board[i][j].isHighlighted = true
    }
  }
} 

function removeHighlight() {
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      board[i][j].isHighlighted = false
    }
  }
  for (let c of myCards) c.isHighlighted = false
}

function animateSuggestedMove(move: MoveAnalysis) {
  removeHighlight()
  saveStateBeforeChange()
  setBoard(gameBoardToBoard(move.move.moveResult.mapAfterMove))
  animateSteps(move.move.moveResult.steps)
}

</script>

<template>
  <div id="move-message">
    Message: {{ moveMessage }}
  </div>
  <div id="gow-grid" style="margin-top: 20px">
    <div>
      <div id="full-board" style="display: flex">
        <div>
          <Team :cards="myCards" @paint="reColor" @highlight="highlightPaint" @dehighlight="removeHighlight()" @card-changed="analysePossibleMoves()" />
        </div>
        <div>
          <div v-for="(line, i) in board" class="no-margin">
            <BoardTile v-for="(el, j) in line" :setup="board[i][j]" :key="board[i][j].key" @clicked="ballClicked(i, j)"/>
          </div>
          <SelectTile v-if="selectTileView.isActive" @selected="tileSelected" />
        </div>
        <div>
          <Team :cards="opponentCards" @paint="reColor" @highlight="highlightPaint" @dehighlight="removeHighlight()" @card-changed="analysePossibleMoves()" />
        </div>
      </div>
      <div style="margin-top: 10px">
        <input type="button" value="roll back" @click="rollBackToPrev"/>
      </div>
    </div>
    <div id="moves-hint" style="margin-top: 10px">
      <input type="button" value="show moves" @click="analysePossibleMoves">
      <div style="width: 900px; display: flex; flex-wrap: wrap">
        <div v-for="(move, i) in suggestedMoves.moves" :key="generateRandomKey()" 
            @mouseover="highlightMove(move.move)" 
            @mouseleave="removeHighlight()"
            @click="animateSuggestedMove(move)" 
            style="display: inline-block">
          <MoveHint :move-analysis="move" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .no-margin {
      margin-bottom: -6px;
  }
  .half .ball {
      opacity: 0.5;
  }
  .manaresult {
    margin-right: 10px;
  }
  .move-hint {
    display: inline-block;
  }
</style>
