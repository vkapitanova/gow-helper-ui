<script setup lang="ts">
import { reactive, onMounted, toRefs, ref } from 'vue';
import { uploadPicture, detectGrid } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

let props = defineProps<{baseUrl: string}>()
let baseUrl = toRefs(props).baseUrl

const windowNames = reactive([])

function setWindowNames() {
  windowNames.push(...sources)
}

var selectedWindow: string = ''

let isActive = ref(false)

function onChange(event: Event) {
  selectedWindow = event.target.value
  electronAPI.selectWindow(selectedWindow)
}

let previousResult: Array<string> | null = null
let gridParsed = false
let coords: [string, string, string] = ["", "", ""]
let picture = ref("")
let pictureActive = ref(false)

function captureScreen() {
  if (isActive.value == true) return
  previousResult = null
  isActive.value = true
  electronAPI.getScreen(selectedWindow)
}

function uploadImage() {
  if (!gridParsed) {
    detectGrid(baseUrl.value, screenshotBuffer(), 'image/jpeg', (result) => {
      if (previousResult == null || (!result.map.includes('UN')) && JSON.stringify(previousResult) !== JSON.stringify(result.map)) {
        coords = [result.x, result.y, result.grid_size]
        picture.value = "data:image/png;base64, " + result.grid
        gridParsed = true
        // electronAPI.followScreen(selectedWindow)
        newPicture()
      }
    })
  }
}

function newPicture() {
  let [x, y, grid_size] = coords
  uploadPicture(baseUrl.value, screenshotBuffer(), x, y, grid_size, 'image/jpeg', (result) => {
    if (previousResult == null || (!result.map.includes('UN')) && JSON.stringify(previousResult) !== JSON.stringify(result.map)) {
      emit('mapReloaded', result)
      previousResult = result.map
    }
  })
}

function pauseFollow() {
  isActive.value = false
  previousResult = null
  gridParsed = false
  electronAPI.pauseFollow()
}

onMounted(() => {
  document.dispatchEvent(new Event('capturer-ready'))
})

</script>

<template>
  <div :class="isActive ? '' : 'disabled'" id="screen-capture" @newimage="uploadImage">
    <select id="sources-list" @ready="setWindowNames" @change="onChange">
      <option v-for="name in windowNames">{{name}}</option>
    </select>
    <!-- <input id="screen-capture-button" type="button" value="Follow" @click="captureScreen" @newimage="uploadImage"/> -->
    <input type="button" value="Pause" @click="pauseFollow"/>
    <button @click="pictureActive = !pictureActive">{{pictureActive ? "hide board" : "show board" }}</button>
    <img v-if="pictureActive" :src="picture"/>
  </div>
</template>

<style>
.disabled {
  opacity: 0.5;
}
</style>