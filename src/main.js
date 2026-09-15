import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/main.css'
import { auth } from './stores/auth'

// 개발 모드 전용. ?devrole=ADMIN 또는 WORKER 로 접속하면 로그인 절차를 건너뛴다.
// 문서용 화면 캡처와 역할별 화면 확인에 사용하며, 프로덕션 빌드에는 포함되지 않는다.
if (import.meta.env.DEV) {
  const role = new URLSearchParams(location.search).get('devrole')
  const preset = {
    ADMIN: { id: 'S001', name: '정소장', role: 'ADMIN', categories: [] },
    WORKER: { id: 'W001', name: '김작업', role: 'WORKER', categories: ['WATER'] }
  }[role]
  if (preset) auth.setUser(preset)
}

createApp(App).use(router).mount('#app')

if (import.meta.env.DEV) {
  import('./mock/api').then((api) => { window.__api = api })
}
