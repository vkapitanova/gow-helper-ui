<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { reactive, onMounted, ref } from 'vue';
import FileUploader from './components/FileUploader.vue'
import ScreenCapturer from './components/ScreenCapturer.vue'
import Board from './components/Board.vue'
import "./assets/css/tiles.css"
import "./assets/css/colors.css"
import { Card } from './models/Cards';

let setup = reactive({tilesList: ['basic_red', 'basic_yellow', 'basic_yellow', 'basic_blue', 'basic_green', 'basic_yellow', 'basic_red', 'block',
                      'basic_yellow', 'basic_red', 'basic_red', 'basic_green', 'basic_violet', 'basic_brown', 'skull_normal', 'skull_rock',
                      'basic_red', 'basic_yellow', 'gargoyle', 'basic_red', 'basic_yellow', 'basic_brown', 'basic_yellow', 'basic_yellow',
                      'basic_red', 'skull_rock', 'skull_rock', 'basic_yellow', 'basic_red', 'basic_yellow', 'basic_blue', 'basic_yellow',
                      'basic_yellow', 'basic_green', 'basic_violet', 'skull_rock', 'basic_green', 'basic_yellow', 'basic_blue', 'basic_red',
                      'basic_red', 'skull_rock', 'basic_yellow', 'basic_green', 'skull_normal', 'basic_green', 'basic_green', 'basic_yellow',
                      'basic_yellow', 'basic_green', 'basic_violet', 'skull_rock', 'basic_yellow', 'basic_yellow', 'basic_blue', 'basic_green',
                      'basic_yellow', 'basic_green', 'basic_violet', 'basic_yellow', 'basic_green', 'basic_yellow', 'basic_blue', 'basic_yellow']})
let myCards: Array<Card> = reactive([])
let opponentCards: Array<Card> = reactive([])

function reloadBoard(res) {
  let len = setup.tilesList.length
  setup.tilesList.splice(0, len, ...res.map)
  let myMana = res.my_mana
  console.log("my mana", myMana)
  for (let i in myCards) {
    myCards[i].hasFullMana = myMana[i]
  }
  let opponentMana = res.opponent_mana
  console.log("opponent mana", opponentMana)
  for (let i in myCards) {
    opponentCards[i].hasFullMana = opponentMana[i]
  }
}

let baseUrl = ref('https://qp4qz4wqea.execute-api.eu-north-1.amazonaws.com/test')

onMounted(() => {
  document.dispatchEvent(new Event('vue-ready'))
})

</script>

<template>
  <div>
    <span>Base url: </span><input type="text" v-model="baseUrl"/>
  </div>
  <FileUploader :base-url="baseUrl" @map-reloaded="reloadBoard"/>
  <ScreenCapturer :base-url="baseUrl" @map-reloaded="reloadBoard"/>
  <Board :tilesList="setup.tilesList" :myCards="myCards" :opponentCards="opponentCards" />
</template>

