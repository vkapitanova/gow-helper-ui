<script setup lang="ts">
import { Painter, PlayerSetup } from '../logic/PlayerSetup';
import { reactive } from 'vue';
import PaintersSetup from './PaintersSetup.vue';

const emit = defineEmits(['paint', 'highlight', 'dehighlight'])

interface Props {
  setup: PlayerSetup
}

const props = defineProps<Props>()
let setup = props.setup

const forzenTilesList = ['YE', 'RE', 'GR', 'BL', 'BR', 'VI', 'SK']

function toggleFrozen(event: Event) {
  const target = event.target as HTMLElement
  target.classList.toggle('selected')
  let tile = target.getAttribute('tile')!
  if (setup.frozenColors.has(tile)) setup.frozenColors.delete(tile)
  else setup.frozenColors.add(tile)
}

// let paintersSetup = reactive({painters: []})

function tryColoring(p: Painter) {
  emit('paint', p)
}

function highlight(p: Painter) {
  emit('highlight', p)
}

function dehighlight() {
  emit('dehighlight')
}

</script>

<template>
  <div style="margin: 10px">
    <div>Заморозка: </div>
    <div>
      <input type="button" v-for="t in forzenTilesList" :class="t" :tile="t" @click="toggleFrozen" style="width:30px;height:30px;"/>
    </div>
    <div>Перекрасы: </div>
    <PaintersSetup :setup="setup" @paint="tryColoring" @highlight="highlight" @dehighlight="dehighlight"/>
  </div>
</template>

<style scoped>
.selected {
  opacity: 0.5
}
</style>