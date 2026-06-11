<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyProducts } from '@/api/seller'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'
import SellerProductTable from '@/components/seller/SellerProductTable.vue'
import SellerProductFormDialog from '@/components/seller/SellerProductFormDialog.vue'
import BackButton from '@/components/BackButton.vue'

const { openAuth } = useAuthDialog()
const { isSeller, fetchCurrentUser } = useUser()

const loading = ref(false)
const products = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const editingProduct = ref(null)

function isUnauthorized(err) {
  return err.response?.status === 401
}

async function loadProducts() {
  if (!isSeller.value) {
    ElMessage.warning('仅卖家账号可查看')
    return
  }
  loading.value = true
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    const res = await getMyProducts(params)
    const body = res.data
    if (!body?.success) {
      ElMessage.error(body?.massage || '加载失败')
      return
    }
    products.value = body.list || []
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '加载失败')
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  loadProducts()
}

function openAdd() {
  editingProduct.value = null
  dialogVisible.value = true
}

function openEdit(row) {
  editingProduct.value = { ...row }
  dialogVisible.value = true
}

function onSaved() {
  dialogVisible.value = false
  loadProducts()
}

onMounted(async () => {
  await fetchCurrentUser()
  loadProducts()
})
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/seller/orders" />
    <header class="page-header page-header-wrap">
      <h2 class="page-title">商品管理</h2>
      <div class="header-actions">
        <el-input
          v-model="keyword"
          placeholder="搜索商品名称"
          clearable
          style="width: 220px"
          @keyup.enter="handleSearch"
        />
        <el-button @click="handleSearch">搜索</el-button>
        <el-button v-if="isSeller" type="primary" @click="openAdd">新增商品</el-button>
      </div>
    </header>

    <el-alert v-if="!isSeller" type="warning" show-icon :closable="false" class="alert-block">
      请使用卖家账号登录（如 seller_us / seller_jp / seller_eu，密码 123456）
    </el-alert>

    <SellerProductTable v-else :products="products" @edit="openEdit" />

    <SellerProductFormDialog
      v-model:visible="dialogVisible"
      :product="editingProduct"
      @saved="onSaved"
    />
  </div>
</template>
