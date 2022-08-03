<script setup lang="ts">
import ColorChange from './ColorChange.vue'
import { reactive } from 'vue';

const emit = defineEmits(['paint'])

interface Props {
  setup: Setup
}
interface Setup {
  painters: Array<Colors>
  frozenColors: Set<string>
}
interface Colors {
  key: number
  from?: string
  to?: string
  isActive: boolean
}

const props = defineProps<Props>()

let setup: Setup = props.setup
const tilesList = ['YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK']
let allPainters: Array<Colors> = reactive([])

var lastKey = 0
function addPainter() {
  allPainters.push(reactive({key: lastKey, isActive: true}))
  lastKey++
  updatePainters()
}

function removePainter(i: number) {
  allPainters.splice(i, 1)
  updatePainters()
}

function tryColoring(c: Colors) {
    emit('paint', c.from!, c.to!)
}

function toggleFrozen(event: Event) {
  const target = event.target as HTMLElement
  target.classList.toggle('selected')
  let tile = target.getAttribute('tile')!
  if (setup.frozenColors.has(tile)) setup.frozenColors.delete(tile)
  else setup.frozenColors.add(tile)
}

function activatePainter(i: number) {
  allPainters[i].isActive = true
  updatePainters()
}

function deactivatePainter(i: number) {
  allPainters[i].isActive = false
  updatePainters()
}

function updatePainters() {
  props.setup.painters = allPainters.filter((p) => p.isActive)
}
</script>

<template>
  <div style="margin: 10px">
    <div>Заморозка: </div>
    <div>
      <input type="button" v-for="t in tilesList" :class="t" :tile="t" @click="toggleFrozen" style="width:30px;height:30px;"/>
    </div>
    <div>Перекрасы: </div>
    <ColorChange v-for="(p, i) in allPainters" :key="p.key" :colors="p" 
      @removeme="removePainter(i)" @tryme="tryColoring(p)" @deactivated="deactivatePainter(i)" @activated="activatePainter(i)"/>
    <input type="button" value="Add" @click="addPainter" />
  </div>
</template>

<style scoped>
.selected {
  opacity: 0.5
}
</style>