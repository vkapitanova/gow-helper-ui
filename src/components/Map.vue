<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { BoardMap, GameBoard, BoardMove, TileWithCoordinates, GameCombination, StepResult, MoveResult, CombinationType, TileType } from './game_board'
import PlayerSetup from './PlayerSetup.vue'
import MoveHint from './MoveHint.vue'

const props = defineProps(['tilesList'])
console.log("map init")
console.log(props.tilesList)
let tilesList: Array<string> = props.tilesList

const boardSize = 8
const map: Array<Array<string>> = reactive([])
initMap()

interface SuggestedMoves {
  moves: Array<MoveAnalysis>
}
let suggestedMoves: SuggestedMoves = reactive({moves: []})

reloadMapFromList(props.tilesList)

const moveMessage = ref('')
var prevMap: Array<Array<string>> = []

interface Setup {
  painters: Array<{from: string; to: string}>
  frozenColors: Set<string>
}
let mySetup = reactive({
  painters: [],
  frozenColors: new Set<string>()
})
let opponentSetup = reactive({
  painters: [],
  frozenColors: new Set<string>()
})

watch(tilesList, async (newList, oldList) => {
  console.log("list updated")
  // suggestedMoves.moves = []
})

interface StepResultData {
  hasAdditionalMove: boolean
  removedCombinations: Array<GameCombination>
}
let stepResult: StepResultData = reactive({
  hasAdditionalMove: false,
  removedCombinations: []
})

interface SelectedTile {
  coords: [number, number]
  tile: HTMLElement
}
var selectedTile: SelectedTile | null = null

const selectTile = reactive({
  active: false,
  x: 0,
  y: 0,
  tiles: ['YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK', 'RS']
})
const animation = {
  fadeTime: 1000,
  pauseTime: 200
}
const emptyElem = 'EM'

function ballClicked(event: Event) {
  const target = event.target as HTMLElement
  let x = Number(target.getAttribute("x-coord"))
  let y = Number(target.getAttribute("y-coord"))
  if (target.classList.contains('un')) {
    selectTile.active = true
    selectTile.x = x
    selectTile.y = x
  } else {
    if (selectedTile == null) {
        selectedTile = {tile: target, coords: [x, y]}
        selectedTile.tile.classList.add('selected')
    } else {
        selectedTile.tile.classList.remove('selected')
        let res = changeTiles([selectedTile.coords[0], selectedTile.coords[1]], [x, y])
        moveMessage.value = res.message
        selectedTile = null
    }
  }
}

interface MoveResponse {
  message: string
}

function changeTiles(coord1: [number, number], coord2: [number, number]): MoveResponse {
  cleanStepResults()
  function noUndefinedTiles() {
    for (var i in map) {
      for (var j in map[i]) {
        if (map[i][j] === 'UN') {
          return false;
        }
      }
    }
    return true;
  }
  if (!noUndefinedTiles()) return { message: 'specify all undefined tiles!' }
  let result = new BoardMove(GameBoard.from(map), mySetup.frozenColors).moveTiles(coord1, coord2)
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
  setMap(result.mapAfterMove)
  setStepResultData(result)
  animateSteps(result.removedCombinations)
  return { message: "move done" }
}

function reColor(from: string, to: string) {
  cleanStepResults()
  saveStateBeforeChange()
  console.log(from, to)
  let result = new BoardMove(GameBoard.from(map), mySetup.frozenColors).colorTiles(from, to)
  if (typeof result === 'string') {
    return { message: result }
  }
  setMap(result.mapAfterMove)
  setStepResultData(result)
  animateSteps(result.removedCombinations)
}

function animateSteps(steps: Array<StepResult>) {
  console.log("animating steps:", steps)
  if (steps.length == 0) {
    return
  }
  let currentStep = steps[0]
  for (let i in currentStep.combinations) {
    let combination = currentStep.combinations[i]
    markTilesWith(combination.tiles, (i, j) => map[i][j] + ' fade')
    setTimeout(() => {setMap(currentStep.finalMap)}, animation.fadeTime);
  }
  let restSteps = steps.slice(1, steps.length)
  if (restSteps.length > 0) {
    setTimeout(() => animateSteps(restSteps), animation.fadeTime + animation.pauseTime);
  }
}

function setStepResultData(moveResult: MoveResult) {
  stepResult.hasAdditionalMove = moveResult.hasAdditionalMove
  stepResult.removedCombinations = []
  for (let s in moveResult.removedCombinations) {
    stepResult.removedCombinations.push(...moveResult.removedCombinations[s].combinations)
  }
}

function cleanStepResults() {
  stepResult.hasAdditionalMove = false
  stepResult.removedCombinations = []
}

function markTilesWith(tiles: Array<TileWithCoordinates>, valueF: (i: number, j: number) => string) {
  for (let t in tiles) {
    let tile = tiles[t]
    map[tile.coords[0]][tile.coords[1]] = valueF(tile.coords[0], tile.coords[1])
  }
}

enum MoveType {
  MoveTiles,
  PaintColor
}

interface FirstMoveAnalysis {
  moveType: MoveType
  coords?: [[number, number], [number, number]]
  colorschange?: [string, string]
  hasAdditionalMove: boolean
  stepResults: Array<StepResult>
  mapAfterMove: BoardMap
  resultMap: BoardMap
  collectedMana: Array<[string, number]>
  totalManaCollected: number
  hasHit: boolean
}

interface SecondMoveAnalysis {
  additionalMove: boolean
  hit: boolean
  canCollectMana: Array<[string, number]>
}

interface MoveAnalysis {
  firstMove: FirstMoveAnalysis,
  secondMove: SecondMoveAnalysis | null
}


function analysePossibleMoves() {
  suggestedMoves.moves = []
  console.log("analysing moves", mySetup)
  let moves: Array<MoveAnalysis> = []
  let firstMoves = analysePossibleMovesAsFirst(GameBoard.from(map).board, mySetup)
  for (let move of firstMoves) {
    let anMove: MoveAnalysis = {firstMove: move, secondMove: null}
    let setup = move.hasAdditionalMove ? mySetup : opponentSetup
    let secondMoves = analysePossibleMovesAsFirst(move.resultMap, setup)
    if (secondMoves.length > 0) {
      anMove.secondMove = {
        additionalMove: false,
        hit: false,
        canCollectMana: []
      }
      let manaMap = new Set<string>
      for (let move2 of secondMoves) {
        if (move2.hasAdditionalMove) anMove.secondMove.additionalMove = true
        if (move2.hasHit) anMove.secondMove.hit = true
        for (let [mana, count] of move2.collectedMana) manaMap.add(mana)
      }
    }
    moves.push(anMove)
  }
  // sort results
  moves.sort((m1, m2) => {
    if (m1.firstMove.hasAdditionalMove != m2.firstMove.hasAdditionalMove) 
      return m1.firstMove.hasAdditionalMove ? -1 : 1
    if (!m1.secondMove) return 1
    if (!m2.secondMove) return -1
    let passMove = !m1.firstMove.hasAdditionalMove
    if (passMove) {
      if (m1.secondMove!.additionalMove != m2.secondMove!.additionalMove)
        return m1.secondMove!.additionalMove ? 1 : -1
      if (m1.secondMove.hit) return 1
    } else {
      if (m1.secondMove!.additionalMove != m2.secondMove!.additionalMove)
        return m1.secondMove!.additionalMove ? -1 : 1
      if (m1.secondMove.hit) return -1
    }
    return m2.firstMove.totalManaCollected - m1.firstMove.totalManaCollected
  })
  // assign suggested moves
  suggestedMoves.moves = moves
  console.log(suggestedMoves)
}

function analysePossibleMovesAsFirst(map: BoardMap, setup: Setup): Array<FirstMoveAnalysis> {
  // look for tiles change
  let moves: Array<FirstMoveAnalysis> = []
  for (let i = 0; i < map.length; i++) {
    for (let j = 1; j < map[i].length; j++) {
        let m1 = tryMove([i, j], [i, j-1], map, setup)
        if (m1 != null) moves.push(m1)
        let m2 = tryMove([j, i], [j-1, i], map, setup)
        if (m2 != null) moves.push(m2)
    }
  }
  for (let painter of setup.painters) {
    let r = tryColoring(map, painter.from, painter.to, setup)
    if (r != null) moves.push(r)
  }
  return moves
}

function tryColoring(map: BoardMap, from: string, to: string, setup: Setup): FirstMoveAnalysis | null {
  let result = new BoardMove(new GameBoard(map), setup.frozenColors).colorTiles(from, to)
  let res = tryGenericMove(result)
  if (res != null) {
    res.moveType = MoveType.PaintColor
    res.colorschange = [from, to]
  }
  return res
}

function tryMove(c1: [number, number], c2: [number, number], map: BoardMap, setup: Setup): FirstMoveAnalysis | null {
  let result = new BoardMove(new GameBoard(map), setup.frozenColors).moveTiles(c1, c2)
  let res = tryGenericMove(result)
  if (res != null) {
    res.moveType = MoveType.MoveTiles
    res.coords = [c1, c2]
  }
  return res
}

function tryGenericMove(result: MoveResult | string): FirstMoveAnalysis | null {
  if (typeof result === 'string') {
    // console.log("wrong move: ", result, c1, c2)
    return null
  }
  if (result.hasMatch) {
    let [manaArray, totalMana, hasHit] = calculateManaFromCombinations(result.removedCombinations)
    
    return {
      moveType: MoveType.MoveTiles,
      hasAdditionalMove: result.hasAdditionalMove,
      stepResults: result.removedCombinations,
      collectedMana: manaArray,
      totalManaCollected: totalMana,
      mapAfterMove: result.mapAfterMove,
      resultMap: result.resultMap,
      hasHit: hasHit
    }
  }
  return null
}

function calculateManaFromCombinations(combinations: Array<StepResult>): [Array<[string, number]>, number, boolean] {
  let collectedMana = new Map(
    [['YE', 0], ['RE', 0], ['GR', 0], ['BL', 0], ['BR', 0], ['VI', 0], ['SK', 0]]
  )
  var totalMana = 0
  var hasHit = false
  for (let i in combinations) {
    let step = combinations[i]
    for (let j in step.combinations) {
      let comb = step.combinations[j]
      if (comb.type == CombinationType.Mana) {
        let key = comb.tiles[0].tile.toString()
        collectedMana.set(key, collectedMana.get(key)! + comb.tiles.length)
        totalMana += comb.tiles.length
      } else if (comb.type == CombinationType.Hit) {
        collectedMana.set('SK', collectedMana.get('SK')! + comb.tiles.length)
        totalMana += comb.tiles.length
        hasHit = true
      } else if (comb.type == CombinationType.Blow) {
        totalMana += comb.tiles.length / 2
        for (let t in comb.tiles) {
          let tile = comb.tiles[t].tile
          if (tile.type == TileType.Color) {
            let key = tile.toString()
            collectedMana.set(key, collectedMana.get(key)! + 0.5)
          }
        }
      }
    }
  }
  let manaArray: Array<[string, number]> = []
  for (let [key, value] of collectedMana) {
    manaArray.push([key, value])
  }
  manaArray = manaArray.filter((c) => c[1] > 0)
  manaArray.sort((a, b) => b[1] - a[1])
  return [manaArray, totalMana, hasHit]
}

function cloneMap() {
  const cloned: Array<Array<string>> = []
  for (let i in map) {
      cloned[i] = []
      for (var j in map[i]) {
          cloned[i][j] = map[i][j]
      }
  }
  return cloned
}

function saveStateBeforeChange() {
    prevMap = cloneMap()
}

function rollBackToPrev() {
  if (prevMap.length > 0) {
    setMap(prevMap)
  }
  prevMap = []
}

function setMap(a: Array<Array<any>>) {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        map[i][j] = a[i][j].toString()
    }
  }
  suggestedMoves.moves = []
}

function reloadMapFromList(newList: Array<string>) {
  console.log(newList)
  var n = 0
  for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
          map[i][j] = newList[n]
          n++
      }
  }
  suggestedMoves.moves = []
}

function initMap() {
  for (let i = 0; i < 8; i++) {
    map[i] = []
    for (let j = 0; j < 8; j++) {
      map[i][j] = 'UN'
    }
  }
}

function highlightMove(move: FirstMoveAnalysis) {
  if (move.moveType == MoveType.MoveTiles) {
    let [[x1, y1], [x2, y2]] = move.coords!
    map[x1][y1] = map[x1][y1] + ' highlight'
    map[x2][y2] = map[x2][y2] + ' highlight'
  } else {
    let [from, to] = move.colorschange!
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          if (map[i][j] == from || map[i][j] == to) {
            map[i][j] += ' highlight'
          }
        }
    }
  }
}

function removeHighlight(move: FirstMoveAnalysis) {
  if (move.moveType == MoveType.MoveTiles) {
    let [[x1, y1], [x2, y2]] = move.coords!
    map[x1][y1] = map[x1][y1].split(' ')[0]
    map[x2][y2] = map[x2][y2].split(' ')[0]
  } else {
    let [from, to] = move.colorschange!
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          let color = map[i][j].split(' ')[0]
          if (color == from || color == to) {
            map[i][j] = map[i][j].split(' ')[0]
          }
        }
    }
  }
}

function animateSuggestedMove(move: MoveAnalysis) {
  removeHighlight(move.firstMove)
  saveStateBeforeChange()
  setMap(move.firstMove.mapAfterMove)
  animateSteps(move.firstMove.stepResults)
}

function tileSelected(event: Event) {
  let target = event.currentTarget as HTMLElement
  map[selectTile.x][selectTile.y] = target.getAttribute("el")!
  selectTile.active = false
}

</script>

<template>
  <div id="move-message">
    Message: {{ moveMessage }}
  </div>
  <div id="gow-grid" style="margin-top: 20px; display: flex">
    <div>
      <div v-for="(line, i) in map" class="no-margin">
          <input v-for="(el, j) in line" class="ball" :class="el" type="button" @click="ballClicked" :x-coord="i" :y-coord="j"/>
      </div>
      <div id="tile-selection" v-if="selectTile.active">
        <input v-for="el in selectTile.tiles" class="tile" v-bind:class="el" v-bind:el="el" type="button" @click="tileSelected"/>
      </div>
      <div id="players-setups" style="display: flex">
        <PlayerSetup :setup="mySetup" @paint="reColor" />
        <PlayerSetup :setup="opponentSetup" @paint="reColor" />
      </div>
      <div style="margin-top: 10px">
        <input type="button" value="roll back" @click="rollBackToPrev"/>
      </div>
      <div id="step-result" v-if="stepResult">
        <div>Has additional move: {{stepResult.hasAdditionalMove}}</div>
        <div>Removed combinations</div>
        <div v-for="comb in stepResult.removedCombinations" :class="comb.type == CombinationType.Blow ? 'half' : 'full'">
            <input v-for="b in comb.tiles" class="ball res" :class="[b.tile.toString()]" type="button" />
        </div>
      </div>
    </div>
    <div id="moves-hint" style="margin-left: 10px">
      <input type="button" value="show moves" @click="analysePossibleMoves">
      <div v-for="(move, i) in suggestedMoves.moves" 
            @mouseover="highlightMove(move.firstMove)" 
            @mouseleave="removeHighlight(move.firstMove)"
            @click="animateSuggestedMove(move)">
        <span>{{i}}: </span>
        <MoveHint :move-analysis="move" />
      </div>
    </div>
  </div>
</template>

<style scoped>
  .no-margin {
      margin-bottom: -6px;
  }
  .ball {
      height: 50px;
      width: 50px;
  }
  .tile {
      height: 35px;
      width: 35px;
      margin-right: 5px;
  }
  .em {
      /*visibility: hidden;*/
      background-color: grey;
  }
  .fade {
      opacity: 0.5;
      /*visibility: hidden;*/
      /*opacity: 0;*/
      /*transition: visibility 0s 2s, opacity 2s linear;*/
  }
  .selected {
      border: 2px solid black;
  }
  .UN {
      background-color: white;
  }
  .half .ball {
      opacity: 0.5;
  }
  .manaresult {
    margin-right: 10px;
  }
  .highlight {
    opacity: 0.5
  }
  .move-hint {
    display: inline-block;
  }
</style>
