<script setup lang="ts">
import ColorChange from './ColorChange.vue'
import { reactive, ref } from 'vue';
import { generateRandomKey } from '../utils/utils';
import { Painter } from '../logic/PlayerSetup';
import { Tile } from '../logic/Tile';

const emit = defineEmits(['paint', 'highlight', 'dehighlight'])

interface PaintersSetupProps {
  setup: {painters: Array<Painter>}
}

const props = defineProps<PaintersSetupProps>()
let setup = props.setup

interface PainterSetupUI {
  name: string
  painterUI: Array<[string, string]>
  isActive: boolean
}
let paintersUI: Array<PainterSetupUI> = reactive([])

let newPainterName = ref('Кастомный')

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

const captionsMap: Map<string, string> = new Map([
  ['EM', '❌'],
  ['YE', '🟨'],
  ['RE', '🟥'],
  ['GR', '🟩'],
  ['BL', '🟦'],
  ['BR', '🟫'],
  ['VI', '🟪'],
  ['SK', '💀'],
  ['RS', '☠️'],
  ['ANY', '🌈'],
])

const preDefinedPainters: Map<string, Array<[string, string]>> = new Map([
  ['Кастомный', [['EM', 'EM']]],
  ['Певец Луны', [['VI', 'GR']]],
  ['Малькандесса', [['YE', 'GR']]],
  ['Ишбала', [['RE', 'SK'], ['GR', 'YE']]],
  ['Могильный мудрец', [['GR', 'VI']]],
  ['Ламашту', [['YE', 'VI']]],
  ['Алхимик', [['ANY', 'YE']]],
  ['Гнев', [['BL', 'BR'], ['YE', 'SK']]],
  ['Хедли', [['VI', 'YE'], ['GR', 'SK']]],
  ['Арбалет Беды', [['BL', 'RS']]],
  ['Облезлый морской волк', [['GR', 'BL']]],
  ['Утонувший матрос', [['YE', 'BL']]],
  ['Дочь льда', [['RE', 'BL']]],
  ['Обреченная Коса', [['YE', 'RS']]],
  ['Хранитель душ', [['ANY', 'SK']]],
  ['Лунный кролик', [['BL', 'YE']]],
  ['Дитя лета', [['BR', 'RE']]],
  ['Яо Гуай', [['VI', 'RE']]],
  ['Старпом Топорищников', [['BL', 'RE']]],
])

const teams: Map<string, Array<[string, boolean]>> = new Map([
  ['-', []],
  ['🟦 Синий Пчела', [['Певец Луны', true], ['Малькандесса', true]]],
  ['🟨 Желтый Ишба', [['Ишбала', false], ['Могильный мудрец', true], ['Ламашту', true]]],
  ['🟫 Коричневый Алхимик', [['Алхимик', false], ['Гнев', false], ['Хедли', false]]],
  ['🟥 Красный Зуул', [['Арбалет Беды', false], ['Облезлый морской волк', true], ['Утонувший матрос', true]]],
  ['🟪 Фиолетовый Зуул', [['Дочь льда', true], ['Утонувший матрос', true]]],
  ['🟪 Фиолетовый Ишба', [['Обреченная Коса', false], ['Ишбала', false], ['Хранитель душ', true], ['Лунный кролик', true]]],
  ['🟩 Зеленый Яо Гуай', [['Дитя лета', true], ['Яо Гуай', false], ['Старпом Топорищников', true]]],
])

function selectTeam(event: Event) {
  cleanPainters()
  let target = event.target as HTMLSelectElement
  let teamName = target.value
  for (let [pName, isActive] of teams.get(teamName)!) {
    addPainter(pName, preDefinedPainters.get(pName)!, isActive)
  }
  updatePainters()
}

function addPainterFromUI(event: Event) {
  console.log("selecting painter: ", newPainterName)
  addPainter(newPainterName.value, preDefinedPainters.get(newPainterName.value)!, true)
}

function addPainter(name: string, p: Array<[string, string]>, isActive: boolean = true) {
  let setupUI: PainterSetupUI = {name: name, painterUI: p, isActive: isActive}
  paintersUI.push(setupUI)
  updatePainters()
}

function togglePainterActive(i: number) {
  paintersUI[i].isActive = !paintersUI[i].isActive
  updatePainters()
}

function removePainter(i: number) {
  paintersUI.splice(i, 1)
  updatePainters()
}

function tryColoring(i: number) {
  emit('paint', toPainter(paintersUI[i].painterUI))
}

function cleanPainters() {
  paintersUI.splice(0, paintersUI.length)
  updatePainters()
}

function changeColorFrom(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  paintersUI[i].painterUI[j][0] = target.value
  updatePainters()
}

function changeColorTo(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  paintersUI[i].painterUI[j][1] = target.value
  updatePainters()
}

function updatePainters() {
  let painters = paintersUI.filter((p) => p.isActive).map((p) => toPainter(p.painterUI))
  setup.painters.splice(0, setup.painters.length, ...painters)
  console.log("updated painters: ", setup.painters)
}

function toPainter(p: Array<[string, string]>): Painter {
  return p.map(([from, to]) => { return {from: tilesMap.get(from)!, to: tilesMap.get(to)![0]} })
}

function highlightPainter(i: number) {
  emit('highlight', toPainter(paintersUI[i].painterUI))
}

function removeHighlight() {
  emit('dehighlight')
}

</script>

<template>
  <div>
    <span>Команды: </span>
    <select @change="selectTeam">
      <option v-for="t in teams.keys()">{{ t }}</option>
    </select>
  </div>
  <div v-for="(p, i) in paintersUI" :class="p.isActive ? 'active' : 'inactive'"
    @mouseover="highlightPainter(i)" 
    @mouseleave="removeHighlight()">
    <span>{{ p.name }}</span>
    <div v-for="(t, j) in p.painterUI">
      <select name="color-from" id="color-from" @change="changeColorFrom($event, i, j)" v-model="t[0]">
          <option v-for="el in tilesMap.keys()" :value="el">{{ captionsMap.get(el) }}</option>
      </select>
      <select name="color-to" id="color-to" @change="changeColorTo($event, i, j)" v-model="t[1]">
          <option v-for="el in tilesMap.keys()" :value="el">{{ captionsMap.get(el) }}</option>
      </select>
    </div>
    <input type="button" value="🚀" @click="tryColoring(i)" />
    <input type="button" :value="p.isActive ? '⏸' : '▶️'" @click="togglePainterActive(i)" />
    <input type="button" value="❌" @click="removePainter(i)" />
  </div>
  <div>
    <select v-model="newPainterName">
      <option v-for="t in preDefinedPainters.keys()">{{ t }}</option>
    </select>
    <input type="button" value="Add" @click="addPainterFromUI" />
  </div>
</template>

<style scoped>
.inactive {
  opacity: 0.5;
}
</style>