<script setup lang="ts">
import { colorToString } from '../utils/transformers';
import { MoveAnalysis } from '../logic/BoardAnalyser';

interface Props {
  moveAnalysis: MoveAnalysis
}

const props = defineProps<Props>()
let moveAnalysis = props.moveAnalysis

let firstAddMove = moveAnalysis.move.moveResult.hasAdditionalMove
let firstHit = moveAnalysis.move.hits > 0
let passMove = !moveAnalysis.move.moveResult.hasAdditionalMove
let secondAddMove = moveAnalysis.nextMoveSummary?.additionalMove

</script>

<template>
  <div class="move-hint">
    <div class="my-move move-container" :class="firstAddMove ? 'addmove' : 'normal'">
      <div class="hit-box" :class="firstHit ? 'hit' : 'no-hit'">{{ firstHit ? '☠︎' : '' }}</div>
      <span v-for="[c, n] in moveAnalysis.move.collectedMana" class="manaresult">
        <div :class="colorToString(c)"></div> x {{n}}
      </span>
    </div>
    <div v-if="moveAnalysis.nextMoveSummary != null" :class="[passMove ? 'opponent-move' : 'my-move', secondAddMove ? 'addmove' : 'normal']" class="move-container">
      <div class="hit-box" :class="moveAnalysis.nextMoveSummary?.hit ? 'hit' : 'no-hit'">{{ moveAnalysis.nextMoveSummary?.hit ? '☠︎' : '' }}</div>
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
.hit-box {
  width: 20px;
  height: 20px;
  margin-left: 10px;
  display: inline-block;
  font-size: 16pt;
}
.hit {
  color: red;
}
.no-hit {
  color: gray;
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