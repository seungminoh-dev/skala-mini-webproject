<script setup>
import { statusLabel, statusMark } from '@/utils/labels'

defineProps({
  status: { type: String, required: true },
  who: { type: String, default: 'staff' },
  late: { type: Boolean, default: false }
})
</script>

<template>
  <!-- 지연은 내부 운영 지표(P-02)다. 신고자 화면에서는 표시하지 않는다. -->
  <span v-if="late && who === 'staff'" class="st st-late"><i /> 지연</span>
  <span v-else class="st" :class="statusMark(status)"><i /> {{ statusLabel(status, who) }}</span>
</template>
