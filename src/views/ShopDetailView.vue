<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getShopDetail } from '@/api/shop'
import { getProductList } from '@/api/product'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const shop = ref(null)
const products = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(12)

const shopId = computed(() => route.params.id)
const defaultImage = 'https://picsum.photos/seed/default/400/400'

async function loadShop() {
  if (!shopId.value) return
  loading.value = true
  shop.value = null
  try {
    const res = await getShopDetail(shopId.value)
    if (res.data?.success && res.data.data) {
      shop.value = res.data.data
      await loadProducts()
    } else {
      ElMessage.error(res.data?.massage || '店铺不存在')
      router.replace('/shops')
    }
  } catch {
    ElMessage.error('加载失败')
    router.replace('/shops')
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  try {
    const res = await getProductList({
      merchantId: shopId.value,
      page: page.value,
      pageSize: pageSize.value,
      sort: 'time_desc',
    })
    const body = res.data
    if (body?.success) {
      products.value = body.list || []
      total.value = body.total ?? 0
    }
  } catch {
    products.value = []
    total.value = 0
  }
}

function goProduct(id) {
  router.push(`/products/${id}`)
}

function handlePageChange(newPage) {
  page.value = newPage
  loadProducts()
}

onMounted(loadShop)
watch(() => route.params.id, loadShop)
</script>

<template>
  <div class="shop-detail-page" v-loading="loading">
    <header class="page-header">
      <el-button link type="primary" @click="router.push('/shops')">← 店铺列表</el-button>
    </header>

    <template v-if="shop">
      <el-card shadow="never" class="shop-info">
        <h2>{{ shop.merchantName }}</h2>
        <div class="region">{{ shop.region }}</div>
        <p class="desc">{{ shop.description || '暂无简介' }}</p>
        <div class="meta">在售 {{ shop.productCount ?? 0 }} 件商品</div>
      </el-card>

      <el-card shadow="never" class="products-block">
        <template #header>店铺商品</template>
        <el-empty v-if="products.length === 0" description="该店铺暂无在售商品" />
        <div v-else class="product-grid">
          <el-card
            v-for="item in products"
            :key="item.id"
            class="product-card"
            shadow="hover"
            @click="goProduct(item.id)"
          >
            <img :src="item.image || defaultImage" :alt="item.productName" class="product-img" />
            <div class="product-name" :title="item.productName">{{ item.productName }}</div>
            <div class="product-meta">
              <span class="price">¥ {{ item.price }}</span>
              <span class="category">{{ item.categoryName }}</span>
            </div>
          </el-card>
        </div>
        <div v-if="total > pageSize" class="pager">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.shop-detail-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}

.shop-info h2 {
  margin: 0 0 8px;
}

.region {
  color: #409eff;
  font-size: 14px;
  margin-bottom: 12px;
}

.desc {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px;
}

.meta {
  color: #909399;
  font-size: 13px;
}

.shop-info,
.products-block {
  margin-bottom: 16px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.product-card {
  cursor: pointer;
}

.product-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 4px;
  background: #f5f7fa;
}

.product-name {
  margin-top: 10px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.category {
  color: #909399;
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
