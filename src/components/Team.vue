<script setup lang="ts">
import { Tile, ManaColor } from '../models/Tile';
import { Card, getCardByName, teams, preDefinedCards } from '../models/Cards';
import { tileToString, tileFromString } from '../utils/transformers'

const emit = defineEmits(['paint', 'highlight', 'dehighlight', 'cardChanged'])

interface TeamSetup {
  cards: Array<Card>
}

const props = defineProps<TeamSetup>()
let cards = props.cards
for (let i = 0; i < 4; i++)
  cards.push(getCardByName('Пусто'))

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

const sortedCards = preDefinedCards.sort((a, b) => a.name > b.name ? 1 : -1)


function tilesFromString(value: string): Array<Tile> {
  if (value == 'any') return Tile.allColors
  return [tileFromString(value)]
}

function tilesToString(tiles: Array<Tile>): string {
  if (tiles.length == 1) return tileToString(tiles[0])
  return 'any'
}

function selectTeam(event: Event) {
  let target = event.target as HTMLSelectElement
  let teamName = target.value
  let team = teams.get(teamName)!
  for (let i in team) {
    cards[i] = getCardByName(team[i]).copy()
  }
  emit('cardChanged')
}

function toggleCardFullMana(i: number) {
  cards[i].hasFullMana = !cards[i].hasFullMana
  emit('cardChanged')
}

function toggleCardFrozen(i: number) {
  cards[i].isFrosen = !cards[i].isFrosen
  emit('cardChanged')
}

function toggleMain(i: number) {
  cards[i].isMain = !cards[i].isMain
  emit('cardChanged')
}

function tryColoring(i: number) {
  emit('paint', cards[i])
}

function changeColorFrom(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  cards[i].transformations[j][0] = tilesFromString(target.value)
  emit('cardChanged')
}

function changeColorTo(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  cards[i].transformations[j][1] = tileFromString(target.value)
  emit('cardChanged')
}

function changeCard(event: Event, i: number) {
  let target = event.target as HTMLSelectElement
  cards[i] = getCardByName(target.value).copy()
  emit('cardChanged')
}

function highlightPainter(i: number) {
  emit('highlight', cards[i])
}

function removeHighlight() {
  emit('dehighlight')
}

</script>

<template>
  <div>
    <select @change="selectTeam" style="margin-left: 5px;">
      <option v-for="t in teams.keys()">{{ t }}</option>
    </select>
  </div>
  <div class="card-container" v-for="(c, i) in cards" :class="[c.hasFullMana ? 'active' : 'inactive', c.isFrosen ? 'frozen' : '', c.isHighlighted ? 'highlighted' : '', c.isMain ? 'main' : '']"
    @mouseover="highlightPainter(i)" 
    @mouseleave="removeHighlight()">
    <div>
      <select @change="changeCard($event, i)">
        <option v-for="pc in sortedCards" :selected="pc.name == c.name">{{ pc.name }}</option>
      </select>
      <div v-for="m in c.mana" class="mana-container" :class="ManaColor[m]"></div>
    </div>
    <div>
      <input type="button" :value="c.isMain ? '🔕' : '🔔'" @click="toggleMain(i)" style="margin: 2px"/>
    </div>
    <div style="display: flex; margin-top: 3px;">
      <div v-for="([from, to], j) in c.transformations" style="margin: 2px">
        <select name="color-from" id="color-from" @change="changeColorFrom($event, i, j)">
            <option v-for="el in captionsMap.keys()" :value="el" :selected="tilesToString(from) == el">{{ captionsMap.get(el) }}</option>
        </select>
        <select name="color-to" id="color-to" @change="changeColorTo($event, i, j)">
            <option v-for="el in captionsMap.keys()" :value="el" :selected="tileToString(to) == el">{{ captionsMap.get(el) }}</option>
        </select>
      </div>
      <input type="button" value="🚀" @click="tryColoring(i)" style="margin: 2px"/>
      <input type="button" :value="c.hasFullMana ? '⏸' : '▶️'" @click="toggleCardFullMana(i)" style="margin: 2px"/>
      <input type="button" :value="c.isFrosen ? '☀️' : '❄️'" @click="toggleCardFrozen(i)" style="margin: 2px"/>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  height: 90px;
  width: 220px;
  margin: 5px;
  padding: 5px;
  border: 2px solid gray;
}
.mana-container {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-left: 3px;
  border-radius: 5px;
  border: 0px solid black;
}
.inactive {
  opacity: 0.5;
}
.frozen {
  background-color: lightblue;
}
.card-container.highlighted {
  background-color: lightgreen;
}

.card-container.main {
  border-color: red;
}
</style>