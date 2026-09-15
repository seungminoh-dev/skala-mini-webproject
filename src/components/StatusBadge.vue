<script setup>
import { statusName } from '@/mock/constants'

defineProps({ status: { type: String, required: true } })

const CLS = {
  RECEIVED: 'received',
  IN_PROGRESS: 'progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELED: 'canceled'
}
</script>

<template>
  <span class="badge" :class="CLS[status]">{{ statusName(status) }}</span>
</template>
