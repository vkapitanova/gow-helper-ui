<script setup lang="ts">
import { reactive, onMounted, toRefs, ref } from 'vue';
import { uploadPicture } from '../utils/upload_picture';

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
}

function captureScreen() {
  if (isActive.value == true) return
  isActive.value = true
  electronAPI.selectWindow(selectedWindow)
}

let previousResult: Array<string> | null = null

function uploadImage() {
  uploadPicture(baseUrl.value, screenshotBuffer(), 'image/jpeg', (result) => {
    if (previousResult == null || (!result.map.includes('UN')) && JSON.stringify(previousResult) !== JSON.stringify(result.map)) {
      emit('mapReloaded', result.map)
      previousResult = result.map
    }
  })
}

function pauseFollow() {
  isActive.value = false
  previousResult = null
  electronAPI.pauseFollow()
}

onMounted(() => {
  document.dispatchEvent(new Event('capturer-ready'))
})

</script>

<template>
  <div :class="isActive ? '' : 'disabled'">
    <select id="sources-list" @ready="setWindowNames" @change="onChange">
      <option v-for="name in windowNames">{{name}}</option>
    </select>
    <input id="screen-capture-button" type="button" value="Follow" @click="captureScreen" @newimage="uploadImage"/>
    <input id="screen-capture-button" type="button" value="Pause" @click="pauseFollow"/>
  </div>
</template>

<style>
.disabled {
  opacity: 0.5;
}
</style>