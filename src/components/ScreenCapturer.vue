<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import axios from 'axios'

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

function uploadImage() {
  axios.put('http://localhost:5000/upload',
      screenshotBuffer(),
      {
          headers: {
              'Content-Type': 'image/jpeg'
          }
      }
  ).then(function (data) {
      console.log(data.data);
      emit('mapReloaded', data.data.map)
  })
}


onMounted(() => {
  console.log(`the component is now mounted.`)
  console.log(document)
  document.dispatchEvent(new Event('capturer-ready'))
})

</script>

<template>
  <div>
    <select id="sources-list" @ready="setWindowNames" @change="onChange">
      <option v-for="name in windowNames">{{name}}</option>
    </select>
    <input id="screen-capture-button" type="button" value="Capture" @click="captureScreen" @newimage="uploadImage"/>
  </div>
</template>