<script setup lang="ts">
import { ref } from 'vue'
import axios from "axios"

const emit = defineEmits(['mapReloaded'])

const file = ref(null)

function submitForm() {
  const selectedFile = file.value.files[0]
  axios.put('http://localhost:5000/upload',
      selectedFile,
      {
          headers: {
              'Content-Type': selectedFile.type
          }
      }
  ).then(function (data) {
      console.log(data.data);
      console.log("emitting event");
      emit('mapReloaded', data.data.map)
  })
}
</script>

<template>
    <div>
        <input ref="file" type="file" name="file"/>
        <button v-on:click="submitForm">Upload</button>
    </div>
</template>

<style scoped>
</style>