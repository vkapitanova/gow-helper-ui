<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { BoardCoordinates, boardSize, GameBoard } from '../logic/GameBoard'
import MoveHint from './MoveHint.vue'
import { Tile } from '../logic/Tile'
import BoardTile from './BoardTile.vue'
import { BoardAnalyser, MoveAnalysis, MoveType, PossibleMove } from '../logic/BoardAnalyser'
import PlayerSetupView from './PlayerSetupView.vue'
import { MovesMaker, StepResult } from '../logic/MovesMaker'
import { boardToGameBoard, gameBoardToBoard, tileFromString, tileToString } from '../utils/transformers'
import { PlayerSetup } from '../logic/PlayerSetup'
import { TileView } from '../models/TileView'
import SelectTile from './SelectTile.vue'
import { generateRandomKey } from '../utils/utils'

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
let mySetup: PlayerSetup = reactive({
  painters: [],
  frozenColors: new Set<string>()
})
let opponentSetup: PlayerSetup = reactive({
  painters: [],
  frozenColors: new Set<string>()
})

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
  let result = new MovesMaker(boardToGameBoard(board), mySetup.frozenColors).moveTiles(coord1, coord2)
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

function reColor(from: Tile, to: Tile) {
  saveStateBeforeChange()
  console.log(from, to)
  let result = new MovesMaker(boardToGameBoard(board), mySetup.frozenColors).paintOver(from, to)
  if (typeof result === 'string') {
    return { message: result }
  }
  setBoard(gameBoardToBoard(result.mapAfterMove))
  animateSteps(result.steps)
  suggestedMoves.moves = []
}

function animateSteps(steps: Array<StepResult>) {
  console.log("animating steps:", steps)
  if (steps.length == 0) {
    return
  }
  let currentStep = steps[0]
  for (let i in currentStep.matches) {
    let match = currentStep.matches[i]
    modifyTiles(match.tiles, (t) => t.fade = true)
  }
  modifyTiles(currentStep.blown.map(([tile, c]) => c) , (t) => t.fade = true)
  setTimeout(() => {setBoard(gameBoardToBoard(currentStep.resultMap))}, animation.fadeTime);
  steps.shift()
  if (steps.length > 0) {
    setTimeout(() => animateSteps(steps), animation.fadeTime + animation.pauseTime);
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
  }
  prevMap = []
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
  let res = new BoardAnalyser(boardToGameBoard(board), mySetup, opponentSetup).analyseBoard()
  console.log(res)
  suggestedMoves.moves.splice(0, suggestedMoves.moves.length, ...res)
}

function highlightMove(move: PossibleMove) {
  if (move.moveType == MoveType.MoveTiles) {
    let [[x1, y1], [x2, y2]] = move.coords!
    board[x1][y1].isHighlighted = true
    board[x2][y2].isHighlighted = true
  } else {
    let [from, to] = move.tilesChanged!
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j].tile.matchesWith(from) || board[i][j].tile.matchesWith(to)) {
            board[i][j].isHighlighted = true
          }
        }
    }
  }
}

function removeHighlight(move: PossibleMove) {
  if (move.moveType == MoveType.MoveTiles) {
    let [[x1, y1], [x2, y2]] = move.coords!
    board[x1][y1].isHighlighted = false
    board[x2][y2].isHighlighted = false
  } else {
    let [from, to] = move.tilesChanged!
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (board[i][j].tile.matchesWith(from) || board[i][j].tile.matchesWith(to)) {
            board[i][j].isHighlighted = false
          }
        }
    }
  }
}

function animateSuggestedMove(move: MoveAnalysis) {
  removeHighlight(move.move)
  saveStateBeforeChange()
  setBoard(gameBoardToBoard(move.move.moveResult.mapAfterMove))
  animateSteps(move.move.moveResult.steps)
}

</script>

<template>
  <div id="move-message">
    Message: {{ moveMessage }}
  </div>
  <div id="gow-grid" style="margin-top: 20px; display: flex">
    <div>
      <div v-for="(line, i) in board" class="no-margin">
          <BoardTile v-for="(el, j) in line" :setup="board[i][j]" :key="board[i][j].key" @clicked="ballClicked(i, j)"/>
      </div>
      <SelectTile v-if="selectTileView.isActive" @selected="tileSelected" />
      <div id="players-setups" style="display: flex">
        <PlayerSetupView :setup="mySetup" @paint="reColor" />
        <PlayerSetupView :setup="opponentSetup" @paint="reColor" />
      </div>
      <div style="margin-top: 10px">
        <input type="button" value="roll back" @click="rollBackToPrev"/>
      </div>
    </div>
    <div id="moves-hint" style="margin-left: 10px">
      <input type="button" value="show moves" @click="analysePossibleMoves">
      <div v-for="(move, i) in suggestedMoves.moves" :key="generateRandomKey()" 
            @mouseover="highlightMove(move.move)" 
            @mouseleave="removeHighlight(move.move)"
            @click="animateSuggestedMove(move)">
        <MoveHint :move-analysis="move" />
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
