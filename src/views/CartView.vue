<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCartList, updateCartItem, deleteCartItem } from '@/api/cart'
import { getProductDetail } from '@/api/product'
import { useAuthDialog } from '@/composables/useAuthDialog'
import ProductNameLink from '@/components/ProductNameLink.vue'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const { openAuth } = useAuthDialog()

const loading = ref(false)
const cartItems = ref([])

const defaultImage = 'https://picsum.photos/seed/default/400/400'

const totalAmount = computed(() =>
  cartItems.value.reduce((sum, item) => {
    const price = item.product?.price ?? 0
    return sum + price * item.quantity
  }, 0)
)

function isUnauthorized(err) {
  return err.response?.status === 401
}

async function loadCart() {
  loading.value = true
  cartItems.value = []
  try {
    const res = await getCartList()
    const body = res.data

    if (!body?.success) {
      ElMessage.error(body?.massage || '购物车加载失败')
      return
    }

    const list = body.list || []
    const enriched = await Promise.all(
      list.map(async (cart) => {
        let product = null
        try {
          const detailRes = await getProductDetail(cart.productId)
          if (detailRes.data?.success) {
            product = detailRes.data.data
          }
        } catch {
          // 商品可能已下架，仍展示购物车记录
        }
        return { ...cart, product }
      })
    )
    cartItems.value = enriched
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '购物车加载失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleQuantityChange(row, newQty) {
  if (newQty < 1) {
    ElMessage.warning('数量至少为 1')
    await loadCart()
    return
  }
  if (row.product?.stock != null && newQty > row.product.stock) {
    ElMessage.warning(`库存不足，最多 ${row.product.stock} 件`)
    await loadCart()
    return
  }

  try {
    const res = await updateCartItem(row.id, newQty)
    if (res.data?.success) {
      row.quantity = newQty
      ElMessage.success('已更新数量')
    } else {
      ElMessage.error(res.data?.massage || '更新失败')
      await loadCart()
    }
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '更新失败')
      await loadCart()
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定从购物车移除该商品？', '提示', { type: 'warning' })
  } catch {
    return
  }

  try {
    const res = await deleteCartItem(row.id)
    if (res.data?.success) {
      ElMessage.success('已移除')
      cartItems.value = cartItems.value.filter((item) => item.id !== row.id)
    } else {
      ElMessage.error(res.data?.massage || '删除失败')
    }
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '删除失败')
    }
  }
}

onMounted(loadCart)
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/products" />
    <header class="page-header">
      <h2 class="page-title">购物车</h2>
      <el-button link type="primary" @click="router.push('/products')">← 继续购物</el-button>
    </header>

    <el-empty v-if="!loading && cartItems.length === 0" description="购物车是空的">
      <el-button type="primary" @click="router.push('/products')">去逛逛</el-button>
    </el-empty>

    <template v-else-if="cartItems.length > 0">
      <el-table :data="cartItems" stripe>
        <el-table-column label="商品" min-width="280">
          <template #default="{ row }">
            <div class="product-cell">
              <img
                :src="row.product?.image || defaultImage"
                :alt="row.product?.productName || '商品'"
                class="thumb"
              />
              <div>
                <ProductNameLink
                  :product-id="row.product?.id ?? row.productId"
                  :name="row.product?.productName || `商品 #${row.productId}`"
                />
                <div class="cell-sub">{{ row.product?.merchantName }} · {{ row.product?.region }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="120">
          <template #default="{ row }">
            <span class="price">¥ {{ row.product?.price ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="160">
          <template #default="{ row }">
            <el-input-number
              :model-value="row.quantity"
              :min="1"
              :max="row.product?.stock ?? 99"
              size="small"
              @change="(val) => handleQuantityChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120">
          <template #default="{ row }">
            <span class="price">
              ¥ {{ row.product?.price != null ? (row.product.price * row.quantity).toFixed(2) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="cart-footer">
        <div class="total">
          合计：<span class="price price-total">¥ {{ totalAmount.toFixed(2) }}</span>
        </div>
        <el-button type="primary" @click="router.push('/checkout')">去结算</el-button>
      </div>
    </template>
  </div>
</template>
