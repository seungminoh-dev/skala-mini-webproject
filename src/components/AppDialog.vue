<script setup>
// 대화상자 공통 조작 (개편 기획 6.6):
// 열리면 내부로 초점 이동, Tab 은 내부에서만 순환, Esc 로 닫기, 닫히면 연 버튼으로 초점 복원.
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  danger: { type: Boolean, default: false }
})
const emit = defineEmits(['close'])

const el = ref(null)
let opener = null

const focusables = () =>
  [...(el.value?.querySelectorAll('button, input, textarea, select, a[href]') ?? [])]
    .filter((n) => !n.disabled)

function onKeydown(e) {
  if (e.key === 'Escape') { e.stopPropagation(); emit('close'); return }
  if (e.key !== 'Tab') return
  const f = focusables()
  if (!f.length) return
  const first = f[0]; const last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

onMounted(() => {
  opener = document.activeElement
  // [data-autofocus] 가 있으면 그곳으로, 없으면 첫 조작 요소로
  const target = el.value?.querySelector('[data-autofocus]') ?? focusables()[0]
  target?.focus()
})
onBeforeUnmount(() => { opener?.focus?.() })
</script>

<template>
  <div class="overlay" @click.self="$emit('close')" @keydown="onKeydown">
    <div ref="el" class="dialog" :class="{ danger }" role="dialog" aria-modal="true" :aria-label="title">
      <div class="dh">
        <h2>{{ title }}</h2>
        <p v-if="message" class="dm">{{ message }}</p>
      </div>
      <div v-if="$slots.body" class="db"><slot name="body" /></div>
      <div class="df"><slot name="actions" /></div>
    </div>
  </div>
</template>
