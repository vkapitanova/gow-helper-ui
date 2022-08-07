<script setup lang="ts">
import { Tile } from '../logic/Tile';
import { tileToString } from '../utils/transformers'

const emit = defineEmits(['selected'])

const tiles = [Tile.yellow, Tile.red, Tile.green, Tile.blue, Tile.brown, Tile.violet, Tile.skull, Tile.rockSkull]

function tileSelected(t: Tile) {
  emit('selected', t)
}

</script>

<template>
  <div id="tile-selection">
    <input v-for="t in tiles" class="tile" :class="tileToString(t)" type="button" @click="tileSelected(t)" style="width:40px;height:40px;"/>
  </div>
</template>

<style scoped>
#tile-selection {
  margin-top: 20px;
}
</style>