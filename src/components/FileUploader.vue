<script setup lang="ts">
import { ref, Ref, toRefs } from 'vue'
import { uploadPicture, detectGrid } from '../utils/upload_picture';

const emit = defineEmits(['mapReloaded'])

let props = defineProps<{baseUrl: string}>()
let baseUrl = toRefs(props).baseUrl
const file: Ref<HTMLInputElement | null> = ref(null)

let picture = ref("")
let pictureActive = ref(false)

function upload() {
  console.log("clicked")
  if (file.value == null || file.value.files == null) {
    console.log("Error: file is null")
    return
  }
  const selectedFile = file.value.files![0]
  detectGrid(baseUrl.value, selectedFile, selectedFile.type, (result: any) => {
    console.log(result)
    picture.value = "data:image/png;base64, " + result.grid
    uploadPicture(baseUrl.value, selectedFile, result.x, result.y, result.grid_size, selectedFile.type, (result: any) => {emit('mapReloaded', result)})
  })
}

</script>

<template>
    <div>
        <input ref="file" type="file" name="file"/>
        <button @click="upload">Upload</button>
        <button @click="pictureActive = !pictureActive">{{pictureActive ? "hide board" : "show board" }}</button>
        <img v-if="pictureActive" :src="picture"/>
    </div>
</template>

<style scoped>
</style>