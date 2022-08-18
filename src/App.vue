<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { reactive, onMounted, ref } from 'vue';
import FileUploader from './components/FileUploader.vue'
import ScreenCapturer from './components/ScreenCapturer.vue'
import Board from './components/Board.vue'
import "./assets/css/tiles.css"

let setup = reactive({tilesList: ['RE', 'YE', 'YE', 'BL', 'GR', 'YE', 'RE', 'BK',
                      'YE', 'RE', 'RE', 'GR', 'VI', 'BR', 'SK', 'RS',
                      'RE', 'YE', 'GG', 'RE', 'YE', 'BR', 'YE', 'YE',
                      'RE', 'RS', 'RS', 'YE', 'RE', 'YE', 'BL', 'YE',
                      'YE', 'GR', 'VI', 'RS', 'GR', 'YE', 'BL', 'RE',
                      'RE', 'RS', 'YE', 'GR', 'SK', 'GR', 'GR', 'YE',
                      'YE', 'GR', 'VI', 'SK', 'GR', 'YE', 'BL', 'GR',
                      'YE', 'GR', 'VI', 'YE', 'GR', 'YE', 'BL', 'YE']})

function reloadBoard(newList: Array<string>) {
  let len = setup.tilesList.length
  setup.tilesList.splice(0, len, ...newList)
}

let baseUrl = ref('http://localhost:5000')

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
  <Board :tilesList="setup.tilesList" />
</template>

