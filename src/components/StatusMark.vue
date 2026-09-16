<script setup>
import { statusLabel, statusMark } from '@/utils/labels'

defineProps({
  status: { type: String, required: true },
  who: { type: String, default: 'staff' },
  late: { type: Boolean, default: false }
})
</script>

<template>
  <span v-if="late" class="st st-late"><i /> 지연</span>
  <span v-else class="st" :class="statusMark(status)"><i /> {{ statusLabel(status, who) }}</span>
</template>
