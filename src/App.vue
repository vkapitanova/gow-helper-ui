<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { reactive, onMounted } from 'vue';
import FileUploader from './components/FileUploader.vue'
import ScreenCapturer from './components/ScreenCapturer.vue'
import Map from './components/Map.vue'

const map = reactive([['SK', 'YE', 'YE', 'BL', 'GR', 'YE', 'RE', 'VI'],
                      ['YE', 'RE', 'RE', 'GR', 'VI', 'BR', 'SK', 'RS'],
                      ['RS', 'YE', 'SK', 'RE', 'YE', 'BR', 'YE', 'YE'],
                      ['YE', 'RS', 'RS', 'YE', 'RE', 'YE', 'BL', 'YE'],
                      ['YE', 'GR', 'VI', 'RS', 'GR', 'YE', 'BL', 'RE'],
                      ['RE', 'RS', 'YE', 'GR', 'SK', 'GR', 'GR', 'YE'],
                      ['YE', 'GR', 'VI', 'SK', 'GR', 'YE', 'BL', 'GR'],
                      ['YE', 'GR', 'VI', 'YE', 'GR', 'YE', 'BL', 'YE']])

function reloadMap(newMap) {
  console.log("in reloadMap")
  console.log(newMap)
  var n = 0
  for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
          map[i][j] = newMap[n]
          n++
      }
  }
  console.log(map)
}

onMounted(() => {
  console.log(`the component is now mounted.`)
  console.log(document)
  document.dispatchEvent(new Event('vue-ready'))
})

</script>

<template>
  <FileUploader @map-reloaded="reloadMap"/>
  <ScreenCapturer @map-reloaded="reloadMap"/>
  <Map :map="map" />
</template>

