<script setup lang="ts">
import { Tile, ManaColor } from '../models/Tile';
import { Card, getCardByName, teams, preDefinedCards } from '../models/Cards';
import { tileToString, tileFromString } from '../utils/transformers'

const emit = defineEmits(['paint', 'highlight', 'dehighlight'])

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
}

function toggleCardFullMana(i: number) {
  cards[i].hasFullMana = !cards[i].hasFullMana
}

function toggleCardFrozen(i: number) {
  cards[i].isFrosen = !cards[i].isFrosen
}

function tryColoring(i: number) {
  emit('paint', cards[i])
}

function changeColorFrom(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  cards[i].transformations[j][0] = tilesFromString(target.value)
}

function changeColorTo(event: Event, i: number, j: number) {
  let target = event.target as HTMLSelectElement
  cards[i].transformations[j][1] = tileFromString(target.value)
}

function changeCard(event: Event, i: number) {
  let target = event.target as HTMLSelectElement
  cards[i] = getCardByName(target.value).copy()
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
  <div class="card-container" v-for="(c, i) in cards" :class="[c.hasFullMana ? 'active' : 'inactive', c.isFrosen ? 'frozen' : '']"
    @mouseover="highlightPainter(i)" 
    @mouseleave="removeHighlight()">
    <div>
      <select @change="changeCard($event, i)">
        <option v-for="pc in sortedCards" :selected="pc.name == c.name">{{ pc.name }}</option>
      </select>
      <div v-for="m in c.mana" class="mana-container" :class="ManaColor[m]"></div>
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
.Yellow {
  background-color: yellow;
}
.Blue {
  background-color: blue;
}
.Red {
  background-color: red;
}
.Violet {
  background-color: violet;
}
.Brown {
  background-color: brown;
}
.Green {
  background-color: green;
}
</style>