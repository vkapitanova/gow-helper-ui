<script setup lang="ts">
import { ref, Ref } from 'vue'
import { uploadPicture } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

const file: Ref<HTMLInputElement | null> = ref(null)

function submitForm() {
  if (file.value == null || file.value.files == null) {
    console.log("Error: file is null")
    return
  }
  const selectedFile = file.value.files![0]
  uploadPicture(selectedFile, selectedFile.type, (result: any) => {emit('mapReloaded', result.map)})
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