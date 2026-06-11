<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCartList } from '@/api/cart'
import { getProductDetail } from '@/api/product'
import { createOrder } from '@/api/order'
import { useAuthDialog } from '@/composables/useAuthDialog'
import ProductNameLink from '@/components/ProductNameLink.vue'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const { openAuth } = useAuthDialog()

const loading = ref(false)
const submitting = ref(false)
const cartItems = ref([])

const form = ref({
  payType: 1,
  address: '',
  receiverName: '',
  receiverPhone: '',
})

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
  try {
    const res = await getCartList()
    const body = res.data
    if (!body?.success) {
      ElMessage.error(body?.massage || '购物车加载失败')
      return
    }
    const list = body.list || []
    if (list.length === 0) {
      ElMessage.warning('购物车为空')
      router.replace('/cart')
      return
    }
    const enriched = await Promise.all(
      list.map(async (cart) => {
        let product = null
        try {
          const detailRes = await getProductDetail(cart.productId)
          if (detailRes.data?.success) product = detailRes.data.data
        } catch {
          /* ignore */
        }
        return { ...cart, product }
      })
    )
    cartItems.value = enriched
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
      router.replace('/cart')
    } else {
      ElMessage.error(err.response?.data?.massage || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!form.value.address?.trim()) {
    ElMessage.warning('请填写收货地址')
    return
  }
  if (!form.value.receiverName?.trim()) {
    ElMessage.warning('请填写收货人')
    return
  }
  if (!form.value.receiverPhone?.trim()) {
    ElMessage.warning('请填写收货电话')
    return
  }

  submitting.value = true
  try {
    const res = await createOrder({
      payType: form.value.payType,
      address: form.value.address.trim(),
      receiverName: form.value.receiverName.trim(),
      receiverPhone: form.value.receiverPhone.trim(),
    })
    const body = res.data
    if (body?.success && body.data?.orderNo) {
      ElMessage.success('下单成功')
      router.push(`/orders/${body.data.orderNo}`)
    } else {
      ElMessage.error(body?.massage || '下单失败')
    }
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '下单失败')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadCart)
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/cart" />
    <header class="page-header">
      <h2 class="page-title">确认订单</h2>
    </header>

    <el-row :gutter="24">
      <el-col :span="14">
        <el-card shadow="never" class="block">
          <template #header>商品清单</template>
          <div v-for="item in cartItems" :key="item.id" class="line-item">
            <ProductNameLink
              :product-id="item.product?.id ?? item.productId"
              :name="item.product?.productName || `商品 #${item.productId}`"
            />
            <span>× {{ item.quantity }}</span>
            <span class="price">¥ {{ item.product?.price != null ? (item.product.price * item.quantity).toFixed(2) : '-' }}</span>
          </div>
          <div class="sum-line">
            合计：<span class="price">¥ {{ totalAmount.toFixed(2) }}</span>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card shadow="never" class="block">
          <template #header>收货与支付</template>
          <el-form label-width="88px">
            <el-form-item label="支付方式">
              <el-radio-group v-model="form.payType">
                <el-radio :value="1">支付宝</el-radio>
                <el-radio :value="2">微信</el-radio>
                <el-radio :value="3">信用卡</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="收货人">
              <el-input v-model="form.receiverName" placeholder="姓名" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="form.receiverPhone" placeholder="手机号" />
            </el-form-item>
            <el-form-item label="地址">
              <el-input v-model="form.address" type="textarea" :rows="3" placeholder="详细地址" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleSubmit">提交订单</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
