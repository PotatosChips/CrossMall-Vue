<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyAfterSales } from '@/api/afterSale'
import {
  AFTER_SALE_TYPE,
  AFTER_SALE_STATUS,
  afterSaleStatusTag,
} from '@/utils/afterSaleMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const { openAuth } = useAuthDialog()

const loading = ref(false)
const list = ref([])

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadList() {
  loading.value = true
  try {
    const res = await getMyAfterSales()
    const body = res.data
    if (body?.success) {
      list.value = body.list || []
    } else {
      ElMessage.error(body?.massage || '加载失败')
    }
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

function goOrder(row) {
  router.push(`/orders/${row.orderNo}`)
}

onMounted(loadList)
</script>

<template>
  <div class="page" v-loading="loading">
    <BackButton fallback="/orders" />
    <header class="page-header">
      <h2 class="page-title">我的售后</h2>
    </header>

    <el-empty v-if="!loading && list.length === 0" description="暂无售后申请" />

    <el-table v-else :data="list" stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="160" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ AFTER_SALE_TYPE[row.type] || row.type }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="申请原因" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="afterSaleStatusTag(row.status)" size="small">
            {{ AFTER_SALE_STATUS[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reply" label="卖家回复" min-width="180" show-overflow-tooltip />
      <el-table-column label="申请时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="goOrder(row)">订单详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
