<script setup>
defineProps({
  center: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  iconTone: { type: String, default: 'red' },
  title: { type: String, default: '' },
  message: { type: String, default: '' }
})
defineEmits(['close'])
</script>

<template>
  <div class="overlay" :class="{ center }" @click.self="$emit('close')">
    <div class="sheet">
      <div v-if="icon" class="icon" :class="iconTone">{{ icon }}</div>
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="message">{{ message }}</p>
      <slot />
    </div>
  </div>
</template>
