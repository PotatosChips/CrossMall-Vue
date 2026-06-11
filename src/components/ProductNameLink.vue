<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  productId: { type: [Number, String], default: null },
  name: { type: String, default: '' },
})

const router = useRouter()

function goDetail() {
  if (props.productId != null && props.productId !== '') {
    router.push(`/products/${props.productId}`)
  }
}
</script>

<template>
  <a
    v-if="productId != null && productId !== ''"
    class="product-link"
    href="#"
    @click.prevent="goDetail"
  >
    {{ name || `商品 #${productId}` }}
  </a>
  <span v-else class="product-link-fallback">{{ name || '—' }}</span>
</template>
