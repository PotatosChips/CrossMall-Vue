<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getShopDetail } from '@/api/shop'
import { getProductList } from '@/api/product'
import BackButton from '@/components/BackButton.vue'

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
  <div class="page" v-loading="loading">
    <BackButton fallback="/shops" />

    <template v-if="shop">
      <el-card shadow="never" class="shop-info block">
        <h2 class="page-title">{{ shop.merchantName }}</h2>
        <div class="text-primary shop-region-line">{{ shop.region }}</div>
        <p class="text-body shop-desc-line">{{ shop.description || '暂无简介' }}</p>
        <div class="text-muted shop-meta-line">在售 {{ shop.productCount ?? 0 }} 件商品</div>
      </el-card>

      <el-card shadow="never" class="block">
        <template #header>店铺商品</template>
        <el-empty v-if="products.length === 0" description="该店铺暂无在售商品" />
        <div v-else class="product-grid shop-product-grid">
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
              <span class="price price-md">¥ {{ item.price }}</span>
              <span class="text-tag">{{ item.categoryName }}</span>
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
.shop-region-line {
  font-size: 14px;
  margin-bottom: 12px;
}

.shop-desc-line {
  line-height: 1.6;
  margin: 0 0 12px;
}

.shop-meta-line {
  font-size: 13px;
}

.shop-product-grid {
  gap: 16px;
  min-height: auto;
}
</style>
