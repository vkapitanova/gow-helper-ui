<script setup lang="ts">
import { TileView } from '../models/TileView';

const emit = defineEmits(['clicked'])

interface Props {
  setup: TileView
}

const props = defineProps<Props>()
let viewSetup = props.setup

function tileClicked() {
  emit('clicked')
}

</script>

<template>
  <input class="tile" :class="[viewSetup.tileClass, viewSetup.isSelected ? 'selected' : '', viewSetup.isHighlighted ? 'highlighted' : '', viewSetup.fade ? 'fade' : '']" type="button" @click="tileClicked"/>
</template>

<style scoped>
  .tile {
      height: 50px;
      width: 50px;
  }
  .EM {
      /*visibility: hidden;*/
      background-color: grey;
  }
  .UN {
      background-color: white;
  }
  .fade {
      opacity: 0.5;
      /*visibility: hidden;*/
      /*opacity: 0;*/
      /*transition: visibility 0s 2s, opacity 2s linear;*/
  }
  .selected {
    border: 2px solid white;
  }
  .highlighted {
    opacity: 0.5
  }
</style>