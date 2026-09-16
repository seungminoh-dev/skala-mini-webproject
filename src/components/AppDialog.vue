<script setup>
defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  danger: { type: Boolean, default: false }
})
defineEmits(['close'])
</script>

<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="dialog" :class="{ danger }">
      <div class="dh">
        <h2>{{ title }}</h2>
        <p v-if="message" class="dm">{{ message }}</p>
      </div>
      <div v-if="$slots.body" class="db"><slot name="body" /></div>
      <div class="df"><slot name="actions" /></div>
    </div>
  </div>
</template>
