import { ref, computed } from 'vue'
import request from '@/api/request'

const user = ref(null)

export function useUser() {
  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(() => user.value?.nickname || user.value?.username || '')
  const isSeller = computed(() => user.value?.role === 1)
  const isBuyer = computed(() => user.value?.role === 0)
  const isAdmin = computed(() => user.value?.role === 2)
  const merchantId = computed(() => user.value?.merchantId ?? null)

  function setUser(data) {
    if (!data?.username) {
      user.value = null
      return
    }
    user.value = {
      username: data.username,
      nickname: data.nickname,
      role: data.role,
      merchantId: data.merchantId ?? null,
    }
  }

  async function fetchCurrentUser() {
    try {
      const res = await request.get('/userInfo')
      if (res.data?.success) {
        setUser(res.data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }

  async function logout() {
    try {
      await request.post('/userLogout')
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  return { user, isLoggedIn, displayName, isSeller, isBuyer, isAdmin, merchantId, setUser, fetchCurrentUser, logout }
}
