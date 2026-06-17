<script setup>

import { ref, onMounted, watch } from 'vue'

import { useRouter, useRoute } from 'vue-router'

import { ElMessage } from 'element-plus'

import { getProductList, getCategories, getRegions } from '@/api/product'

import { useAuthDialog } from '@/composables/useAuthDialog'

import { useUser } from '@/composables/useUser'



const router = useRouter()

const route = useRoute()

const { openAuth } = useAuthDialog()

const { isLoggedIn, displayName } = useUser()



const loading = ref(false)

const products = ref([])

const categories = ref([])

const total = ref(0)



const categoryName = ref('')

const region = ref('')

const keyword = ref('')

const sort = ref('time_desc')

const page = ref(1)

const pageSize = ref(10)



const regionOptions = ref([])



const sortOptions = [

  { label: '最新上架', value: 'time_desc' },

  { label: '最早上架', value: 'time_asc' },

  { label: '名称 A-Z', value: 'name_asc' },

  { label: '名称 Z-A', value: 'name_desc' },

  { label: '价格从低到高', value: 'price_asc' },

  { label: '价格从高到低', value: 'price_desc' },

]



const defaultImage = 'https://picsum.photos/seed/default/400/400'



async function fetchRegions() {

  try {

    const res = await getRegions()

    regionOptions.value = res.data?.list || []

  } catch {

    ElMessage.error('地区加载失败')

  }

}



async function fetchCategories() {

  try {

    const res = await getCategories()

    categories.value = res.data?.list || []

  } catch {

    ElMessage.error('分类加载失败')

  }

}



async function fetchProducts() {

  loading.value = true

  try {

    const params = {

      page: page.value,

      pageSize: pageSize.value,

      sort: sort.value,

    }

    if (categoryName.value) params.categoryName = categoryName.value

    if (region.value) params.region = region.value

    if (keyword.value) params.keyword = keyword.value



    const res = await getProductList(params)

    const body = res.data



    if (body?.success) {

      products.value = body.list || []

      total.value = body.total ?? 0

    } else {

      ElMessage.error(body?.massage || '商品加载失败')

      products.value = []

      total.value = 0

    }

  } catch (err) {

    ElMessage.error(err.response?.data?.massage || '商品加载失败')

    products.value = []

    total.value = 0

  } finally {

    loading.value = false

  }

}



function handleSearch() {

  page.value = 1

  fetchProducts()

}



function selectCategory(name) {

  categoryName.value = name

  page.value = 1

  fetchProducts()

}



function goDetail(id) {

  router.push(`/products/${id}`)

}



function handlePageChange(newPage) {

  page.value = newPage

  fetchProducts()

}



function handleSizeChange(newSize) {

  pageSize.value = newSize

  page.value = 1

  fetchProducts()

}



watch(sort, () => {

  page.value = 1

  fetchProducts()

})



onMounted(async () => {

  if (route.query.categoryName) {

    categoryName.value = String(route.query.categoryName)

  }

  await fetchCategories()

  await fetchRegions()

  await fetchProducts()

})

</script>



<template>

  <div class="page page-wide">

    <header class="page-header">

      <h2 class="page-title">跨境商城</h2>

      <div class="header-actions">

        <el-button link @click="router.push('/')">首页</el-button>

        <el-button v-if="!isLoggedIn" type="primary" link @click="openAuth('login')">登录</el-button>

        <span v-else class="user-label">{{ displayName }}</span>

      </div>

    </header>



    <div class="toolbar">

      <el-input

        v-model="keyword"

        placeholder="搜索商品名称"

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



      <el-select v-model="sort" placeholder="排序" style="width: 160px">

        <el-option v-for="o in sortOptions" :key="o.value" :label="o.label" :value="o.value" />

      </el-select>

    </div>



    <div class="category-bar">

      <el-check-tag :checked="!categoryName" @change="selectCategory('')">全部</el-check-tag>

      <el-check-tag

        v-for="c in categories"

        :key="c.id"

        :checked="categoryName === c.categoryName"

        @change="selectCategory(c.categoryName)"

      >

        {{ c.categoryName }}

      </el-check-tag>

    </div>



    <div v-loading="loading" class="product-grid">

      <el-empty v-if="!loading && products.length === 0" description="暂无商品" />



      <el-card

        v-for="item in products"

        :key="item.id"

        class="product-card"

        shadow="hover"

        @click="goDetail(item.id)"

      >

        <img :src="item.image || defaultImage" :alt="item.productName" class="product-img" />

        <div class="product-name" :title="item.productName">{{ item.productName }}</div>

        <div class="product-meta">

          <span class="price price-md">¥ {{ item.price }}</span>

          <span class="text-region">{{ item.region }}</span>

        </div>

        <div class="product-category">{{ item.categoryName }}</div>

      </el-card>

    </div>



    <div v-if="total > 0" class="pager">

      <el-pagination

        v-model:current-page="page"

        v-model:page-size="pageSize"

        :page-sizes="[10, 20, 30]"

        :total="total"

        layout="total, sizes, prev, pager, next"

        @current-change="handlePageChange"

        @size-change="handleSizeChange"

      />

    </div>

  </div>

</template>



<style scoped>

.category-bar {

  display: flex;

  gap: 8px;

  flex-wrap: wrap;

  margin-bottom: 20px;

}

</style>


