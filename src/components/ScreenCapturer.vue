<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { uploadPicture } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

const windowNames = reactive([])

function setWindowNames() {
  windowNames.push(...sources)
}

var selectedWindow: string = ''

function onChange(event: Event) {
  selectedWindow = event.target.value
}

function captureScreen() {
  electronAPI.selectWindow(selectedWindow)
}

let previousResult: Array<string> | null = null

function uploadImage() {
  uploadPicture(screenshotBuffer(), 'image/jpeg', (result) => {
    if (previousResult == null || (!result.map.includes('UN')) && JSON.stringify(previousResult) !== JSON.stringify(result.map)) {
      emit('mapReloaded', result.map)
      previousResult = result.map
    }
  })
}

function pauseFollow() {
  electronAPI.pauseFollow()
}

onMounted(() => {
  document.dispatchEvent(new Event('capturer-ready'))
})

</script>

<template>
  <div>
    <select id="sources-list" @ready="setWindowNames" @change="onChange">
      <option v-for="name in windowNames">{{name}}</option>
    </select>
    <input id="screen-capture-button" type="button" value="Follow" @click="captureScreen" @newimage="uploadImage"/>
    <input id="screen-capture-button" type="button" value="Pause" @click="pauseFollow"/>
  </div>
</template>