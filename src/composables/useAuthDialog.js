import { ref } from 'vue'

const visible = ref(false)
const mode = ref('login')

export function useAuthDialog() {
  function openAuth(targetMode = 'login') {
    mode.value = targetMode
    visible.value = true
  }

  function closeAuth() {
    visible.value = false
  }

  function switchMode(targetMode) {
    mode.value = targetMode
  }

  return { visible, mode, openAuth, closeAuth, switchMode }
}
