<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSellerOrderList } from '@/api/order'
import {
  PAY_TYPE,
  SELLER_ORDER_FILTERS,
  sellerOrderStatusLabel,
  sellerOrderStatusTag,
  matchSellerOrderFilter,
} from '@/utils/orderMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import BackButton from '@/components/BackButton.vue'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { openAuth } = useAuthDialog()
const { isSeller, fetchCurrentUser } = useUser()

const loading = ref(false)
const orders = ref([])
const statusFilter = ref('all')

const filteredOrders = computed(() => {
  return orders.value.filter((o) => matchSellerOrderFilter(o, statusFilter.value))
})

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadOrders() {
  if (!isSeller.value) {
    ElMessage.warning('仅卖家账号可查看')
    return
  }
  loading.value = true
  try {
    const res = await getSellerOrderList()
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
  router.push(`/seller/orders/${row.orderNo}`)
}

onMounted(async () => {
  await fetchCurrentUser()
  loadOrders()
})
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/products" />
    <header class="page-header">
      <h2 class="page-title">店铺订单</h2>
      <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 150px">
        <el-option
          v-for="item in SELLER_ORDER_FILTERS"
          :key="String(item.value)"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </header>

    <el-alert v-if="!isSeller" type="warning" show-icon :closable="false" class="alert-block">
      请使用卖家账号登录（如 seller_us / seller_jp / seller_eu，密码 123456）
    </el-alert>

    <el-empty v-else-if="!loading && filteredOrders.length === 0" description="暂无符合条件的订单" />

    <el-table v-else :data="filteredOrders" stripe @row-click="goDetail">
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
          <el-tag :type="sellerOrderStatusTag(row)" size="small">
            {{ sellerOrderStatusLabel(row) }}
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
