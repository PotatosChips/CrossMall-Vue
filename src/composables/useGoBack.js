import { useRouter } from 'vue-router'

export function useGoBack() {
  const router = useRouter()

  /** 返回上一页；若无历史记录则跳转 fallback */
  function goBack(fallback = '/') {
    const hasHistory = window.history.state?.back != null
    if (hasHistory) {
      router.back()
    } else {
      router.push(fallback)
    }
  }

  return { goBack }
}
