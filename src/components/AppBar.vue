<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  back: { type: [Boolean, Object], default: false }
})
const router = useRouter()

function goBack(back) {
  if (typeof back === 'object' && back !== null) router.push(back)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="appbar">
    <button v-if="back" class="iconbtn" aria-label="뒤로" @click="goBack(back)">‹</button>
    <h1>{{ title }}</h1>
    <span class="spacer" />
    <slot name="right" />
  </header>
</template>
