<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const code = ref('')

function go() {
  const id = code.value.trim().toUpperCase()
  if (!id) return
  router.push({ name: 'complaint', params: { id } })
}
</script>

<template>
  <AppBar title="민원 조회" :back="{ path: '/' }" />

  <main class="screen narrow">
    <h2 style="font-size: 19px; margin: 8px 0 6px">민원 번호를 입력하세요</h2>
    <p class="hint" style="margin-bottom: 16px">접수 완료 화면에서 발급된 번호를 입력합니다.</p>

    <input v-model="code" class="input" placeholder="예: M-260915-A7K2Q9" @keyup.enter="go" />
    <button class="btn" style="margin-top: 10px" @click="go">조회하기</button>

    <div class="notice info" style="margin-top: 16px">
      <strong>공개 조회 안내</strong><br />
      상태와 처리 이력은 비밀번호 없이 확인할 수 있습니다. 수정과 취소에만 비밀번호가 필요합니다.
    </div>
  </main>

  <TabBar role="USER" />
</template>
