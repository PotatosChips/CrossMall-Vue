<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderList } from '@/api/order'
import { PAY_TYPE, buyerOrderStatusLabel, buyerOrderStatusTag } from '@/utils/orderMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const { openAuth } = useAuthDialog()

const loading = ref(false)
const orders = ref([])

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await getOrderList()
    const body = res.data
    if (!body?.success) {
      ElMessage.error(body?.massage || '加载失败')
      return
    }
    orders.value = body.list || []
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

function goDetail(row) {
  router.push(`/orders/${row.orderNo}`)
}

onMounted(loadOrders)
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/products" />
    <header class="page-header">
      <h2 class="page-title">我的订单</h2>
      <el-button link type="primary" @click="router.push('/cart')">购物车</el-button>
    </header>

    <el-empty v-if="!loading && orders.length === 0" description="暂无订单">
      <el-button type="primary" @click="router.push('/products')">去逛逛</el-button>
    </el-empty>

    <el-table v-else :data="orders" stripe @row-click="goDetail">
      <el-table-column prop="orderNo" label="订单号" min-width="160" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span class="price">¥ {{ row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="支付方式" width="100">
        <template #default="{ row }">{{ PAY_TYPE[row.payType] || '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="buyerOrderStatusTag(row)" size="small">
            {{ buyerOrderStatusLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="goDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
