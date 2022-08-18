<script setup lang="ts">
import { ref, Ref, toRefs } from 'vue'
import { uploadPicture } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

let props = defineProps<{baseUrl: string}>()
let baseUrl = toRefs(props).baseUrl
const file: Ref<HTMLInputElement | null> = ref(null)

function submitForm() {
  console.log(baseUrl)
  if (file.value == null || file.value.files == null) {
    console.log("Error: file is null")
    return
  }
  const selectedFile = file.value.files![0]
  uploadPicture(baseUrl.value, selectedFile, selectedFile.type, (result: any) => {emit('mapReloaded', result.map)})
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