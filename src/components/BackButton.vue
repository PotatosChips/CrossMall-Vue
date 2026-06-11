<script setup>
import { useGoBack } from '@/composables/useGoBack'

defineProps({
  fallback: { type: String, default: '/' },
  label: { type: String, default: '← 返回' },
})

const { goBack } = useGoBack()
</script>

<template>
  <div class="back-nav">
    <el-button link type="primary" @click="goBack(fallback)">{{ label }}</el-button>
  </div>
</template>
