<script setup lang="ts">
import { reactive, onMounted, toRefs, ref } from 'vue';
import { uploadPicture, detectGrid } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

let props = defineProps<{baseUrl: string}>()
let baseUrl = toRefs(props).baseUrl

const windowNames = reactive([])

function setWindowNames() {
  windowNames.splice(0, windowNames.length, ...getWindowNames())
}

var selectedWindow: string = ''

function onChange(event: Event) {
  selectedWindow = event.target.value
  electronAPI.selectWindow(selectedWindow)
}

let previousResult: Array<string> | null = null
let gridParsed = ref(false)
let coords: [string, string, string] = ["", "", ""]
let picture = ref("")
let pictureActive = ref(false)

function reset() {
  gridParsed.value = false
  previousResult = null
  electronAPI.getSources()
}

function uploadImage() {
  if (!gridParsed.value) {
    picture.value = "data:image/jpeg;base64, " + btoa(screenshotBuffer())
    detectGrid(baseUrl.value, screenshotBuffer(), 'image/jpeg', (result) => {
        coords = [result.x, result.y, result.grid_size]
        picture.value = "data:image/png;base64, " + result.grid
        gridParsed.value = true
        newPicture()
    })
  } else {
    newPicture()
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

onMounted(() => {
  document.dispatchEvent(new Event('capturer-ready'))
})

</script>

<template>
  <div :class="gridParsed ? 'grid-detected' : ''" id="screen-capture" @newimage="uploadImage">
    <select id="sources-list" @ready="setWindowNames" @change="onChange">
      <option v-for="name in windowNames">{{name}}</option>
    </select>
    <input type="button" value="Reset" @click="reset"/>
    <button @click="pictureActive = !pictureActive">{{pictureActive ? "hide board" : "show board" }}</button>
    <img v-if="pictureActive" :src="picture"/>
  </div>
</template>

<style>
.grid-detected {
  background-color: lightgreen;
}
</style>