<script setup lang="ts">
import { move } from 'fs-extra';
import { BoardMap, StepResult } from './game_board'

interface Props {
  moveAnalysis: MoveAnalysis
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

const props = defineProps<Props>()
let moveAnalysis = props.moveAnalysis

let firstAddMove = moveAnalysis.firstMove.hasAdditionalMove
let firstHit = moveAnalysis.firstMove.hasHit
let passMove = !moveAnalysis.firstMove.hasAdditionalMove
let secondAddMove = moveAnalysis.secondMove?.additionalMove

</script>

<template>
  <div class="move-hint">
    <div class="my-move move-container" :class="firstAddMove ? 'addmove' : 'normal'">
      <div v-if="firstHit" class="hit"></div>
      <span v-for="m in moveAnalysis.firstMove.collectedMana" class="manaresult">
        <div :class="m[0]"></div> x {{m[1]}}
      </span>
    </div>
    <div v-if="moveAnalysis.secondMove != null" :class="[passMove ? 'opponent-move' : 'my-move', secondAddMove ? 'addmove' : 'normal']" class="move-container">
      <div v-if="moveAnalysis.secondMove?.hit" class="hit"></div>
    </div>
  </div>
</template>

<style scoped>
.green {
  background-color: green;
}
.red {
  background-color: red;
}
.hit {
  background-image: url(../assets/images/skull.jpeg);
  background-size: 100%;
  width: 20px;
  height: 20px;
  margin-left: 10px;
  display: inline-block;
}
.manaresult div {
  width: 20px;
  height: 20px;
  margin-left: 10px;
  display: inline-block;
}
.my-move {
  border-color: green;
}
.opponent-move {
  border-color: red;
}
.move-container {
  border-style: solid;
  padding-top: 5px;
  padding-right: 5px;
  margin-bottom: 5px;
  margin-top: 5px;
  margin-right: 5px;
  display: inline-block;
}
.move-container.addmove {
  border-width: 2px;
}
.move-container.normal {
  border-width: 1px;
}

</style>