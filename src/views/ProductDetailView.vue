<script setup>

import { ref, onMounted, watch } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { ElMessage } from 'element-plus'

import { getProductDetail } from '@/api/product'
import { getProductReviews } from '@/api/review'
import { addToCart } from '@/api/cart'

import { useAuthDialog } from '@/composables/useAuthDialog'



const route = useRoute()

const router = useRouter()

const { openAuth } = useAuthDialog()



const loading = ref(false)

const adding = ref(false)

const product = ref(null)
const reviews = ref([])
const quantity = ref(1)



const defaultImage = 'https://picsum.photos/seed/default/400/400'

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function fetchReviews(productId) {
  try {
    const res = await getProductReviews(productId)
    reviews.value = res.data?.list || []
  } catch {
    reviews.value = []
  }
}

function isUnauthorized(err) {

  return err.response?.status === 401

}



async function fetchDetail() {

  loading.value = true

  product.value = null

  quantity.value = 1

  try {

    const res = await getProductDetail(route.params.id)

    const body = res.data



    if (body?.success && body.data) {
      product.value = body.data
      await fetchReviews(body.data.id)
    } else {

      ElMessage.warning(body?.massage || '商品不存在或已下架')

    }

  } catch (err) {

    ElMessage.error(err.response?.data?.massage || '加载失败')

  } finally {

    loading.value = false

  }

}



async function handleAddToCart() {

  if (!product.value) return

  if (quantity.value < 1) {

    ElMessage.warning('数量至少为 1')

    return

  }

  if (quantity.value > product.value.stock) {

    ElMessage.warning(`库存不足，最多 ${product.value.stock} 件`)

    return

  }



  adding.value = true

  try {

    const res = await addToCart(product.value.id, quantity.value)

    const body = res.data



    if (body?.success) {

      ElMessage.success('已加入购物车')

    } else {

      ElMessage.error(body?.massage || '加入购物车失败')

      if (body?.massage === '请先登录') {

        openAuth('login')

      }

    }

  } catch (err) {

    if (isUnauthorized(err)) {

      ElMessage.warning('请先登录')

      openAuth('login')

    } else {

      ElMessage.error(err.response?.data?.massage || '加入购物车失败')

    }

  } finally {

    adding.value = false

  }

}



onMounted(fetchDetail)



watch(

  () => route.params.id,

  () => {

    if (route.name === 'product-detail') fetchDetail()

  }

)

</script>



<template>

  <div class="detail-page" v-loading="loading">

    <div class="detail-nav">

      <el-button link type="primary" @click="router.push('/products')">← 返回商城</el-button>

    </div>



    <div v-if="product" class="detail-body">

      <img

        :src="product.image || defaultImage"

        :alt="product.productName"

        class="detail-img"

      />

      <div class="detail-info">

        <h2>{{ product.productName }}</h2>

        <p class="price">¥ {{ product.price }}</p>

        <el-descriptions :column="1" border size="small" class="meta">

          <el-descriptions-item label="分类">{{ product.categoryName }}</el-descriptions-item>

          <el-descriptions-item label="商家">
            <el-button
              v-if="product.merchantId"
              type="primary"
              link
              @click="router.push(`/shops/${product.merchantId}`)"
            >
              {{ product.merchantName }}
            </el-button>
            <span v-else>{{ product.merchantName }}</span>
          </el-descriptions-item>

          <el-descriptions-item label="地区">{{ product.region }}</el-descriptions-item>

          <el-descriptions-item label="库存">{{ product.stock }}</el-descriptions-item>

        </el-descriptions>

        <el-divider />

        <h4>商品描述</h4>

        <p class="desc">{{ product.description || '暂无描述' }}</p>

        <div class="buy-row">

          <span class="qty-label">数量</span>

          <el-input-number v-model="quantity" :min="1" :max="product.stock" />

          <el-button type="primary" :loading="adding" @click="handleAddToCart">

            加入购物车

          </el-button>

          <el-button @click="router.push('/cart')">查看购物车</el-button>

        </div>

      </div>

    </div>

    <el-card v-if="product" shadow="never" class="reviews-block">
      <template #header>用户评价（{{ reviews.length }}）</template>
      <el-empty v-if="reviews.length === 0" description="暂无评价" :image-size="80" />
      <div v-else class="review-list">
        <div v-for="item in reviews" :key="item.id" class="review-item">
          <div class="review-head">
            <span class="review-user">{{ item.nickname || '用户' }}</span>
            <el-rate :model-value="item.score" disabled size="small" />
            <span class="review-time">{{ formatTime(item.createTime) }}</span>
          </div>
          <p class="review-content">{{ item.content || '用户未填写评价内容' }}</p>
        </div>
      </div>
    </el-card>

    <el-empty v-else-if="!loading" description="商品不存在或已下架">

      <el-button type="primary" @click="router.push('/products')">返回商城</el-button>

    </el-empty>

  </div>

</template>



<style scoped>

.detail-page {

  max-width: 960px;

  margin: 0 auto;

  padding: 24px;

}



.detail-nav {

  margin-bottom: 8px;

}



.detail-body {

  display: flex;

  gap: 32px;

  margin-top: 12px;

}



.detail-img {

  width: 380px;

  height: 380px;

  object-fit: cover;

  border-radius: 8px;

  background: #f5f7fa;

  flex-shrink: 0;

}



.detail-info {

  flex: 1;

}



.price {

  color: #f56c6c;

  font-size: 28px;

  font-weight: bold;

  margin: 12px 0 16px;

}



.meta {

  margin-bottom: 8px;

}



.desc {

  line-height: 1.8;

  color: #606266;

  white-space: pre-wrap;

}



.buy-row {

  display: flex;

  align-items: center;

  gap: 12px;

  margin-top: 16px;

  flex-wrap: wrap;

}



.qty-label {

  color: #606266;

  font-size: 14px;

}



@media (max-width: 768px) {

  .detail-body {

    flex-direction: column;

  }



  .detail-img {

    width: 100%;

    height: auto;

    aspect-ratio: 1;

  }

}

.reviews-block {
  margin-top: 24px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.review-item {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.review-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.review-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.review-user {
  font-weight: 600;
  color: #303133;
}

.review-time {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}

.review-content {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

</style>


