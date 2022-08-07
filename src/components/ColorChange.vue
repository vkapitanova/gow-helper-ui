<script setup lang="ts">
import { Painter } from '../logic/PlayerSetup';
import { Tile } from '../logic/Tile';

export interface PainterSetupUI {
  painter: Painter
  isActive: boolean
}
interface ColorChangeProps {setup: PainterSetupUI}
let props = defineProps<ColorChangeProps>()
let setup = props.setup
const emit = defineEmits(['removeme', 'tryme', 'deactivated', 'activated'])

const tilesMap: Map<string, Array<Tile>> = new Map([
  ['EM', [Tile.empty]], 
  ['YE', [Tile.yellow]], 
  ['RE', [Tile.red]], 
  ['GR', [Tile.green]], 
  ['BL', [Tile.blue]], 
  ['BR', [Tile.brown]],
  ['VI', [Tile.violet]], 
  ['SK', [Tile.skull]], 
  ['RS', [Tile.rockSkull]],
  ['ANY', [Tile.yellow, Tile.violet, Tile.red, Tile.green, Tile.brown, Tile.blue]]
])

let painter = setup.painter
painter.from = [Tile.yellow]
painter.to = Tile.yellow
setup.isActive = true

function removeMe() {
  emit('removeme')
}

function tryMe() {
  emit('tryme')
}

function toggleActive() {
  setup.isActive = !setup.isActive
  if (setup.isActive) emit('activated')
  else emit('deactivated')
}

function changeFrom(event: Event) {
  let target = event.target as HTMLSelectElement
  setup.painter.from = tilesMap.get(target.value)!
}

function changeTo(event: Event) {
  let target = event.target as HTMLSelectElement
  setup.painter.to = tilesMap.get(target.value)![0]
}

</script>

<template>
  <div :class="setup.isActive ? 'active' : 'inactive'">
    <select name="color-from" id="color-from" @change="changeFrom">
        <option v-for="el in tilesMap.keys()">{{ el }}</option>
    </select>
    <select name="color-to" id="color-to" @change="changeTo">
        <option v-for="el in tilesMap.keys()">{{ el }}</option>
    </select>
    <input type="button" value="🚀" @click="tryMe" />
    <input type="button" :value="setup.isActive ? '⏸' : '▶️'" @click="toggleActive" />
    <input type="button" value="❌" @click="removeMe" />
  </div>
</template>

<style scoped>
.inactive {
  opacity: 0.5;
}
</style>