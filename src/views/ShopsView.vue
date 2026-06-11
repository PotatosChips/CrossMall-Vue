<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getShopList } from '@/api/shop'
import { getRegions } from '@/api/product'

const router = useRouter()

const loading = ref(false)
const shops = ref([])
const total = ref(0)
const region = ref('')
const keyword = ref('')
const page = ref(1)
const pageSize = ref(9)
const regionOptions = ref([])

async function fetchRegions() {
  try {
    const res = await getRegions()
    regionOptions.value = res.data?.list || []
  } catch {
    ElMessage.error('地区加载失败')
  }
}

async function fetchShops() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (region.value) params.region = region.value
    if (keyword.value) params.keyword = keyword.value

    const res = await getShopList(params)
    const body = res.data
    if (body?.success) {
      shops.value = body.list || []
      total.value = body.total ?? 0
    } else {
      ElMessage.error(body?.massage || '店铺加载失败')
      shops.value = []
      total.value = 0
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '店铺加载失败')
    shops.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchShops()
}

function goShop(id) {
  router.push(`/shops/${id}`)
}

function handlePageChange(newPage) {
  page.value = newPage
  fetchShops()
}

onMounted(async () => {
  await fetchRegions()
  await fetchShops()
})
</script>

<template>
  <div class="shops-page" v-loading="loading">
    <header class="page-header">
      <h2>店铺</h2>
    </header>

    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索店铺名称"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
      <el-select
        v-model="region"
        placeholder="全部地区"
        clearable
        style="width: 140px"
        @change="handleSearch"
      >
        <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r" />
      </el-select>
    </div>

    <el-empty v-if="!loading && shops.length === 0" description="暂无店铺" />

    <div v-else class="shop-grid">
      <el-card
        v-for="shop in shops"
        :key="shop.id"
        class="shop-card"
        shadow="hover"
        @click="goShop(shop.id)"
      >
        <div class="shop-name">{{ shop.merchantName }}</div>
        <div class="shop-region">{{ shop.region }}</div>
        <div class="shop-desc">{{ shop.description || '暂无简介' }}</div>
        <div class="shop-meta">在售 {{ shop.productCount ?? 0 }} 件商品</div>
      </el-card>
    </div>

    <div v-if="total > 0" class="pager">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.shops-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.shop-card {
  cursor: pointer;
}

.shop-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.shop-region {
  color: #409eff;
  font-size: 13px;
  margin-bottom: 10px;
}

.shop-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.shop-meta {
  margin-top: 12px;
  color: #909399;
  font-size: 13px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
