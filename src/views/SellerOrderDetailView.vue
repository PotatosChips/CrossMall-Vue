<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getSellerOrderDetail,
  shipOrder,
  updateLogistics,
  addTrack,
} from '@/api/order'
import {
  PAY_TYPE,
  LOGISTICS_STATUS,
  LOGISTICS_COMPANIES,
  SELLER_LOGISTICS_STATUS_OPTIONS,
  sellerOrderStatusLabel,
  sellerOrderStatusTag,
} from '@/utils/orderMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const router = useRouter()
const { openAuth } = useAuthDialog()
const { isSeller, fetchCurrentUser } = useUser()

const loading = ref(false)
const shipLoading = ref(false)
const updateLoading = ref(false)
const trackLoading = ref(false)
const order = ref(null)

const shipForm = ref({
  company: '',
  estimatedArrival: '',
  content: '',
})

const logisticsForm = ref({
  estimatedArrival: '',
  status: 1,
})

const trackForm = ref({
  content: '',
})

const orderNo = computed(() => route.params.orderNo)

/** 待支付、已完成、已取消：只读 */
const isReadOnly = computed(() => {
  if (!order.value) return true
  return [0, 3, 4].includes(order.value.status)
})

/** 已支付未发货：首次发货 */
const canFirstShip = computed(() => order.value?.status === 1 && !order.value?.logistics)

/** 运输中：可更新物流 / 追加轨迹 */
const canManageLogistics = computed(() => {
  const lg = order.value?.logistics
  return order.value?.status === 2 && lg && lg.status === 1
})

/** 卖家已标记送到，等待买家确认 */
const isWaitingBuyerConfirm = computed(() => order.value?.logistics?.status === 3)

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

function syncLogisticsForm() {
  const lg = order.value?.logistics
  if (!lg) return
  logisticsForm.value = {
    estimatedArrival: lg.estimatedArrival
      ? String(lg.estimatedArrival).replace(' ', 'T').slice(0, 19)
      : '',
    status: lg.status ?? 1,
  }
}

async function loadDetail() {
  if (!orderNo.value) return
  if (!isSeller.value) {
    ElMessage.warning('仅卖家账号可查看')
    return
  }
  loading.value = true
  order.value = null
  try {
    const res = await getSellerOrderDetail(orderNo.value)
    const body = res.data
    if (body?.success && body.data) {
      order.value = body.data
      syncLogisticsForm()
    } else {
      ElMessage.error(body?.massage || '订单不存在或无权查看')
      router.replace('/seller/orders')
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

async function handleShip() {
  if (!shipForm.value.company) {
    ElMessage.warning('请选择物流公司')
    return
  }
  shipLoading.value = true
  try {
    const res = await shipOrder(orderNo.value, {
      company: shipForm.value.company,
      estimatedArrival: shipForm.value.estimatedArrival || undefined,
      content: shipForm.value.content?.trim() || undefined,
    })
    const body = res.data
    if (body?.success) {
      ElMessage.success(`发货成功，运单号：${body.data?.trackingNo || ''}`)
      shipForm.value.content = ''
      await loadDetail()
    } else {
      ElMessage.error(body?.massage || '发货失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '发货失败')
  } finally {
    shipLoading.value = false
  }
}

async function handleUpdateLogistics() {
  updateLoading.value = true
  try {
    const res = await updateLogistics(orderNo.value, {
      company: order.value.logistics.company,
      estimatedArrival: logisticsForm.value.estimatedArrival || undefined,
      status: logisticsForm.value.status,
    })
    if (res.data?.success) {
      ElMessage.success('物流信息已更新')
      await loadDetail()
    } else {
      ElMessage.error(res.data?.massage || '更新失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '更新失败')
  } finally {
    updateLoading.value = false
  }
}

async function handleAddTrack() {
  if (!trackForm.value.content?.trim()) {
    ElMessage.warning('请填写轨迹描述')
    return
  }
  trackLoading.value = true
  try {
    const res = await addTrack(orderNo.value, {
      content: trackForm.value.content.trim(),
    })
    if (res.data?.success) {
      ElMessage.success('轨迹已添加')
      trackForm.value.content = ''
      await loadDetail()
    } else {
      ElMessage.error(res.data?.massage || '添加失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '添加失败')
  } finally {
    trackLoading.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  loadDetail()
})
watch(() => route.params.orderNo, loadDetail)
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <header class="page-header">
      <h2>店铺订单详情</h2>
      <div class="header-actions">
        <el-button link type="primary" @click="router.push({ path: '/seller/after-sales', query: { orderNo: orderNo } })">
          本单售后
        </el-button>
        <el-button link type="primary" @click="router.push('/seller/orders')">← 店铺订单</el-button>
      </div>
    </header>

    <el-alert v-if="!isSeller" type="warning" show-icon :closable="false" class="block">
      请使用卖家账号登录
    </el-alert>

    <template v-else-if="order">
      <el-alert
        v-if="order.status === 0"
        type="info"
        show-icon
        :closable="false"
        class="block"
        title="买家尚未支付，仅可查看，无法发货或修改物流"
      />

      <el-card shadow="never" class="block">
        <div class="head-row">
          <div>
            <div class="order-no">{{ order.orderNo }}</div>
            <div class="sub">下单时间：{{ formatTime(order.createTime) }}</div>
          </div>
          <el-tag :type="sellerOrderStatusTag(order)" size="large">
            {{ sellerOrderStatusLabel(order) }}
          </el-tag>
        </div>
        <el-descriptions :column="2" class="desc">
          <el-descriptions-item label="本店金额">
            <span class="price">¥ {{ order.totalAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ PAY_TYPE[order.payType] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ order.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ order.address }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card shadow="never" class="block">
        <template #header>本店商品明细</template>
        <el-table :data="order.items || []" stripe>
          <el-table-column prop="productName" label="商品" min-width="200" />
          <el-table-column label="单价" width="120">
            <template #default="{ row }">¥ {{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="小计" width="120">
            <template #default="{ row }">
              ¥ {{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 首次发货 -->
      <el-card v-if="canFirstShip" shadow="never" class="block">
        <template #header>首次发货</template>
        <el-form label-width="100px" style="max-width: 480px">
          <el-form-item label="物流公司" required>
            <el-select v-model="shipForm.company" placeholder="请选择" style="width: 100%">
              <el-option v-for="c in LOGISTICS_COMPANIES" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="预计到达">
            <el-date-picker
              v-model="shipForm.estimatedArrival"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              placeholder="可选"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="首条轨迹">
            <el-input v-model="shipForm.content" type="textarea" placeholder="可选，默认自动生成" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="shipLoading" @click="handleShip">确认发货</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 物流信息与在途管理 -->
      <el-card shadow="never" class="block">
        <template #header>物流信息</template>
        <template v-if="order.logistics">
          <el-descriptions :column="2">
            <el-descriptions-item label="物流公司">{{ order.logistics.company }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ order.logistics.trackingNo }}</el-descriptions-item>
            <el-descriptions-item label="物流状态">
              {{ LOGISTICS_STATUS[order.logistics.status] || order.logistics.status }}
            </el-descriptions-item>
            <el-descriptions-item label="预计到达">
              {{ formatTime(order.logistics.estimatedArrival) }}
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="order.tracks?.length" class="tracks">
            <div class="tracks-title">物流轨迹</div>
            <el-timeline>
              <el-timeline-item
                v-for="(t, idx) in order.tracks"
                :key="idx"
                :timestamp="formatTime(t.trackTime)"
                placement="top"
              >
                {{ t.content }}
              </el-timeline-item>
            </el-timeline>
          </div>

          <template v-if="canManageLogistics">
            <el-divider />
            <div class="section-title">更新物流</div>
            <el-form label-width="100px" style="max-width: 480px">
              <el-form-item label="预计到达">
                <el-date-picker
                  v-model="logisticsForm.estimatedArrival"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="物流状态">
                <el-select v-model="logisticsForm.status" style="width: 100%">
                  <el-option
                    v-for="opt in SELLER_LOGISTICS_STATUS_OPTIONS"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button :loading="updateLoading" @click="handleUpdateLogistics">保存</el-button>
              </el-form-item>
            </el-form>

            <el-divider />
            <div class="section-title">追加轨迹</div>
            <el-form label-width="100px" style="max-width: 480px">
              <el-form-item label="轨迹描述">
                <el-input v-model="trackForm.content" type="textarea" :rows="3" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="trackLoading" @click="handleAddTrack">添加轨迹</el-button>
              </el-form-item>
            </el-form>
          </template>
        </template>
        <el-alert
          v-if="isWaitingBuyerConfirm"
          type="success"
          show-icon
          :closable="false"
          class="delivered-alert"
          title="已标记送到，等待买家确认收货，物流信息不可再修改"
        />
        <el-empty v-else-if="!canFirstShip && !order.logistics" description="暂无物流信息" :image-size="80" />
        <p v-else class="hint">填写上方「首次发货」表单后，运单号将由系统自动生成</p>
      </el-card>

      <el-alert
        v-if="isReadOnly && order.status !== 0"
        type="info"
        show-icon
        :closable="false"
        title="订单已结束，仅可查看"
      />
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.block {
  margin-bottom: 16px;
}

.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.order-no {
  font-size: 18px;
  font-weight: 600;
}

.sub {
  font-size: 13px;
  color: #909399;
  margin-top: 6px;
}

.desc {
  margin-top: 8px;
}

.price {
  color: #f56c6c;
  font-weight: 600;
}

.tracks {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.tracks-title,
.section-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.hint {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.delivered-alert {
  margin-top: 16px;
}
</style>
