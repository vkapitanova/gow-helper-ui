<script setup lang="ts">
import ColorChange from './ColorChange.vue'
import { PainterSetupUI } from './ColorChange.vue'
import { PlayerSetup, Painter } from '../logic/PlayerSetup'
import { reactive } from 'vue';
import { Tile } from '../logic/Tile';
import { generateRandomKey } from '../utils/utils';

const emit = defineEmits(['paint'])

interface Props {
  setup: PlayerSetup
}

const props = defineProps<Props>()

let setup: PlayerSetup = props.setup
const tilesList = ['YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK']
let paintersUI: Array<[string, PainterSetupUI]> = reactive([])

function addPainter() {
  let setupUI: PainterSetupUI = {painter: {from: [], to: Tile.empty}, isActive: true}
  paintersUI.push([generateRandomKey(), setupUI])
  updatePainters()
}

function removePainter(i: number) {
  paintersUI.splice(i, 1)
  updatePainters()
}

function tryColoring(p: PainterSetupUI) {
    emit('paint', p.painter.from[0], p.painter.to)
}

function toggleFrozen(event: Event) {
  const target = event.target as HTMLElement
  target.classList.toggle('selected')
  let tile = target.getAttribute('tile')!
  if (setup.frozenColors.has(tile)) setup.frozenColors.delete(tile)
  else setup.frozenColors.add(tile)
}

function activatePainter(i: number) {
  paintersUI[i][1].isActive = true
  updatePainters()
}

function deactivatePainter(i: number) {
  paintersUI[i][1].isActive = false
  updatePainters()
}

function updatePainters() {
  props.setup.painters = paintersUI.filter((p) => p[1].isActive).map((p) => p[1].painter)
}
</script>

<template>
  <div style="margin: 10px">
    <div>Заморозка: </div>
    <div>
      <input type="button" v-for="t in tilesList" :class="t" :tile="t" @click="toggleFrozen" style="width:30px;height:30px;"/>
    </div>
    <div>Перекрасы: </div>
    <ColorChange v-for="([key, p], i) in paintersUI" :key="key" :setup="p" 
      @removeme="removePainter(i)" @tryme="tryColoring(p)" @deactivated="deactivatePainter(i)" @activated="activatePainter(i)"/>
    <input type="button" value="Add" @click="addPainter" />
  </div>
</template>

<style scoped>
.selected {
  opacity: 0.5
}
</style>