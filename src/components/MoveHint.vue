<script setup lang="ts">
import { tileToString } from '../utils/transformers';
import { MoveAnalysis, MoveType } from '../logic/BoardAnalyser';
import { ManaColor } from '../models/Tile';

interface Props {
  moveAnalysis: MoveAnalysis
}

const props = defineProps<Props>()
let moveAnalysis = props.moveAnalysis

let firstAddMove = moveAnalysis.move.moveResult.hasAdditionalMove
let firstHit = moveAnalysis.move.hits > 0
let passMove = !moveAnalysis.move.moveResult.hasAdditionalMove
let secondAddMove = moveAnalysis.nextMoveSummary?.additionalMove
let tilesMove = moveAnalysis.move.moveType == MoveType.MoveTiles

const captionsMap: Map<string, string> = new Map([
  ['empty', '❌'],
  ['basic_yellow', '🟨'],
  ['basic_red', '🟥'],
  ['basic_green', '🟩'],
  ['basic_blue', '🟦'],
  ['basic_brown', '🟫'],
  ['basic_violet', '🟪'],
  ['skull_normal', '💀'],
  ['skull_rock', '☠️'],
  ['any', '🌈'],
])

</script>

<template>
  <div class="move-hint" :class="firstAddMove ? 'addmove' : ''">
    <div style="display: grid">
      <div style="display: flex">
        <div class="hit-box" :class="firstHit ? 'hit' : 'no-hit'">{{ firstHit ? '☠︎' : '' }}</div>
        <div class="move-type">
          <div v-if="tilesMove == true" class="tiles-move">🎲</div>
          <div v-if="tilesMove == false" class="card-move">
            <div style="margin-right: 3px;" v-for="c in moveAnalysis.move.tilesChanged!">
              <span class="color-change">{{ captionsMap.get(tileToString(c[0])) }}</span>
              <span class="color-change">{{ captionsMap.get(tileToString(c[1])) }}</span>
            </div>
            <span class="card-name">{{ moveAnalysis.move.cardPlayed?.name }}</span>
          </div>
        </div>
      </div>
      <div class="collected-mana">
        <span v-for="[c, n] in moveAnalysis.move.collectedMana" class="manaresult" :class="ManaColor[c]">{{n}}</span>
      </div>
      <div class="next-move-summary">
        <div class="next-move-addmove" :class="passMove ? 'red-text' : 'green-text'">{{secondAddMove ? '+' : '-'}}</div>
        <div class="next-move-hit">{{moveAnalysis.nextMoveSummary?.hit ? '☠︎' : ''}}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.move-hint {
  width: 200px;
  height: 97px;
  border: 1px solid gray;
  margin: 5px;
}
.move-hint.addmove {
  border-width: 2px;
}
.green {
  background-color: green;
}
.red {
  background-color: red;
}
.card-move {
  display: flex;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.card-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 3px;
}
.hit-box {
  width: 30px;
  height: 30px;
  font-size: 18pt;
  /* border: 1px solid gray; */
  text-align: center;
  line-height: 30px;
}
.hit {
  color: red;
}
.no-hit {
  color: gray;
}
.move-type {
  display: flex;
  padding-left: 5px;
  padding-right: 5px;
  text-align: center;
  line-height: 30px;
  height: 30px;
  width: 156px;
  /* border: 1px solid gray; */
}
.collected-mana {
  margin: 3px;
  display: flex;
  flex-wrap: wrap;
}
.manaresult {
  display: inline-block;
  width: 27px;
  height: 27px;
  margin-right: 4px;
  border-radius: 13px;
  border: 0px solid black;
  text-align: center;
  line-height: 27px;
}
.next-move-summary {
  display: flex;
}
.next-move-summary div {
  display: inline-block;
  width: 30px;
  height: 30px;
  font-size: 18pt;
  /* border: 1px solid gray; */
  text-align: center;
  line-height: 30px;
}
.red-text {
  color: red;
}
.green-text {
  color: green;
}

</style>