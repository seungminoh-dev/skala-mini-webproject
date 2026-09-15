<script setup>
import StatusBadge from './StatusBadge.vue'
import { categoryName, priorityName } from '@/mock/constants'

defineProps({
  complaint: { type: Object, required: true },
  to: { type: [String, Object], required: true },
  showAssignee: { type: Boolean, default: false }
})
</script>

<template>
  <router-link class="list-item" :to="to">
    <div class="top">
      <span v-if="complaint.delayed" class="badge delay">지연</span>
      <StatusBadge v-else :status="complaint.status" />
      <span v-if="showAssignee" class="who">
        {{ complaint.assigneeName ?? '미배정' }}
      </span>
      <span v-else class="who">{{ complaint.elapsed }}</span>
    </div>
    <div class="title">{{ complaint.title }}</div>
    <div class="meta">
      {{ priorityName(complaint.priority) }} · {{ categoryName(complaint.categoryCode) }} ·
      {{ complaint.elapsed }}
    </div>
  </router-link>
</template>
