<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps(['colors'])
const emit = defineEmits(['removeme', 'tryme', 'deactivated', 'activated'])

const tilesList = ['EM', 'YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK', 'RS']
const defaultTile = 'EM'
let colors = props.colors
colors.from = defaultTile
colors.to = defaultTile
colors.isActive = true

function removeMe() {
  emit('removeme')
}

function tryMe() {
  emit('tryme')
}

function toggleActive() {
  colors.isActive = !colors.isActive
  if (colors.isActive) emit('activated')
  else emit('deactivated')
}
</script>

<template>
  <div :class="colors.isActive ? 'active' : 'inactive'">
    <span>From: </span>
    <select name="color-from" id="color-from" v-model="colors.from">
        <option>none</option>
        <option v-for="el in tilesList">{{ el }}</option>
    </select>
    <span>To: </span>
    <select name="color-to" id="color-to" v-model="colors.to">
        <option>none</option>
        <option v-for="el in tilesList">{{ el }}</option>
    </select>
    <input type="button" value="try" @click="tryMe" />
    <input type="button" :value="colors.isActive ? 'deactivate' : 'activate'" @click="toggleActive" />
    <input type="button" value="remove" @click="removeMe" />
  </div>
</template>

<style scoped>
.inactive {
  opacity: 0.5;
}
</style>