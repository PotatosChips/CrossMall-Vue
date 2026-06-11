<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOrderDetail,
  payOrder,
  updateReceiver,
  confirmOrder,
  deleteOrder,
} from '@/api/order'
import { PAY_TYPE, LOGISTICS_STATUS, buyerOrderStatusLabel, buyerOrderStatusTag } from '@/utils/orderMeta'
import { getOrderReviews, submitReview } from '@/api/review'
import { getOrderAfterSales, applyAfterSale } from '@/api/afterSale'
import {
  AFTER_SALE_TYPE,
  AFTER_SALE_STATUS,
  afterSaleStatusTag,
  afterSaleTypeOptions,
  canApplyAfterSale,
} from '@/utils/afterSaleMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'

const route = useRoute()
const router = useRouter()
const { openAuth } = useAuthDialog()

const loading = ref(false)
const acting = ref(false)
const order = ref(null)
const receiverDialogVisible = ref(false)
const receiverSaving = ref(false)
const receiverForm = ref({
  payType: 1,
  address: '',
  receiverName: '',
  receiverPhone: '',
})

const orderReviews = ref([])
const reviewDialogVisible = ref(false)
const reviewSaving = ref(false)
const reviewTarget = ref(null)
const reviewForm = ref({ score: 5, content: '' })

const afterSales = ref([])
const afterSaleDialogVisible = ref(false)
const afterSaleSaving = ref(false)
const afterSaleForm = ref({ type: null, reason: '' })

const afterSaleTypeList = computed(() => afterSaleTypeOptions(order.value?.status))
const showApplyAfterSale = computed(() => canApplyAfterSale(order.value, afterSales.value))

const orderNo = computed(() => route.params.orderNo)

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadDetail() {
  if (!orderNo.value) return
  loading.value = true
  order.value = null
  try {
    const res = await getOrderDetail(orderNo.value)
    const body = res.data
    if (body?.success && body.data) {
      order.value = body.data
      if (body.data.status === 3) {
        await loadOrderReviews()
      } else {
        orderReviews.value = []
      }
      if (body.data.status >= 1 && body.data.status !== 4) {
        await loadAfterSales()
      } else {
        afterSales.value = []
      }
    } else {
      ElMessage.error(body?.massage || '订单不存在')
      router.replace('/orders')
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

async function runAction(fn, successMsg) {
  acting.value = true
  try {
    const res = await fn(orderNo.value)
    const body = res.data
    if (body?.success) {
      ElMessage.success(successMsg)
      await loadDetail()
    } else {
      ElMessage.error(body?.massage || '操作失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '操作失败')
  } finally {
    acting.value = false
  }
}

async function handlePay() {
  await runAction(payOrder, '支付成功')
}

function openReceiverDialog() {
  receiverForm.value = {
    payType: order.value.payType,
    address: order.value.address,
    receiverName: order.value.receiverName,
    receiverPhone: order.value.receiverPhone,
  }
  receiverDialogVisible.value = true
}

async function handleSaveReceiver() {
  const f = receiverForm.value
  if (!f.address?.trim() || !f.receiverName?.trim() || !f.receiverPhone?.trim()) {
    ElMessage.warning('请填写完整收货信息')
    return
  }
  receiverSaving.value = true
  try {
    const res = await updateReceiver(orderNo.value, {
      payType: f.payType,
      address: f.address.trim(),
      receiverName: f.receiverName.trim(),
      receiverPhone: f.receiverPhone.trim(),
    })
    if (res.data?.success) {
      ElMessage.success('收货信息已更新')
      receiverDialogVisible.value = false
      await loadDetail()
    } else {
      ElMessage.error(res.data?.massage || '更新失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '更新失败')
  } finally {
    receiverSaving.value = false
  }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确认已收到货物？', '提示', { type: 'warning' })
  } catch {
    return
  }
  await runAction(confirmOrder, '已确认收货')
}

async function loadAfterSales() {
  try {
    const res = await getOrderAfterSales(orderNo.value)
    afterSales.value = res.data?.list || []
  } catch {
    afterSales.value = []
  }
}

function openAfterSaleDialog() {
  const options = afterSaleTypeList.value
  afterSaleForm.value = {
    type: options[0]?.value ?? null,
    reason: '',
  }
  afterSaleDialogVisible.value = true
}

async function handleApplyAfterSale() {
  const f = afterSaleForm.value
  if (!f.type) {
    ElMessage.warning('请选择售后类型')
    return
  }
  if (!f.reason?.trim()) {
    ElMessage.warning('请填写申请原因')
    return
  }
  afterSaleSaving.value = true
  try {
    const res = await applyAfterSale({
      orderNo: orderNo.value,
      type: f.type,
      reason: f.reason.trim(),
    })
    if (res.data?.success) {
      ElMessage.success('售后申请已提交')
      afterSaleDialogVisible.value = false
      await loadAfterSales()
    } else {
      ElMessage.error(res.data?.massage || '申请失败')
    }
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '申请失败')
    }
  } finally {
    afterSaleSaving.value = false
  }
}

async function loadOrderReviews() {
  try {
    const res = await getOrderReviews(orderNo.value)
    orderReviews.value = res.data?.list || []
  } catch {
    orderReviews.value = []
  }
}

function getReviewForProduct(productId) {
  return orderReviews.value.find((r) => r.productId === productId)
}

function openReviewDialog(row) {
  reviewTarget.value = row
  reviewForm.value = { score: 5, content: '' }
  reviewDialogVisible.value = true
}

async function handleSubmitReview() {
  if (!reviewTarget.value) return
  if (!reviewForm.value.score) {
    ElMessage.warning('请选择评分')
    return
  }
  reviewSaving.value = true
  try {
    const res = await submitReview({
      orderNo: orderNo.value,
      productId: reviewTarget.value.productId,
      score: reviewForm.value.score,
      content: reviewForm.value.content,
    })
    if (res.data?.success) {
      ElMessage.success('评价成功')
      reviewDialogVisible.value = false
      await loadOrderReviews()
    } else {
      ElMessage.error(res.data?.massage || '评价失败')
    }
  } catch (err) {
    if (isUnauthorized(err)) {
      ElMessage.warning('请先登录')
      openAuth('login')
    } else {
      ElMessage.error(err.response?.data?.massage || '评价失败')
    }
  } finally {
    reviewSaving.value = false
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定删除该待支付订单？', '提示', { type: 'warning' })
  } catch {
    return
  }
  acting.value = true
  try {
    const res = await deleteOrder(orderNo.value)
    if (res.data?.success) {
      ElMessage.success('已删除')
      router.push('/orders')
    } else {
      ElMessage.error(res.data?.massage || '删除失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '删除失败')
  } finally {
    acting.value = false
  }
}

onMounted(loadDetail)
watch(() => route.params.orderNo, loadDetail)
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <header class="page-header">
      <h2>订单详情</h2>
      <el-button link type="primary" @click="router.push('/orders')">← 订单列表</el-button>
    </header>

    <template v-if="order">
      <el-card shadow="never" class="block">
        <div class="head-row">
          <div>
            <div class="order-no">{{ order.orderNo }}</div>
            <div class="sub">下单时间：{{ formatTime(order.createTime) }}</div>
          </div>
          <el-tag :type="buyerOrderStatusTag(order)" size="large">
            {{ buyerOrderStatusLabel(order) }}
          </el-tag>
        </div>
        <el-descriptions :column="2" class="desc">
          <el-descriptions-item label="支付方式">{{ PAY_TYPE[order.payType] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="price">¥ {{ order.totalAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="收货人">{{ order.receiverName }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ order.receiverPhone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ order.address }}</el-descriptions-item>
        </el-descriptions>

        <div class="actions">
          <el-button v-if="order.status === 0" @click="openReceiverDialog">修改收货信息</el-button>
          <el-button v-if="order.status === 0" type="primary" :loading="acting" @click="handlePay">
            模拟支付
          </el-button>
          <el-button v-if="order.status === 0" type="danger" plain :loading="acting" @click="handleDelete">
            删除订单
          </el-button>
          <el-button v-if="order.status === 2" type="success" :loading="acting" @click="handleConfirm">
            确认收货
          </el-button>
          <el-button v-if="showApplyAfterSale" type="warning" plain @click="openAfterSaleDialog">
            申请售后
          </el-button>
          <el-button v-if="order.status >= 1 && order.status !== 4" link type="primary" @click="router.push('/after-sales')">
            我的售后
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="block">
        <template #header>商品明细</template>
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
          <el-table-column v-if="order.status === 3" label="评价" width="140" fixed="right">
            <template #default="{ row }">
              <template v-if="getReviewForProduct(row.productId)">
                <el-rate
                  :model-value="getReviewForProduct(row.productId).score"
                  disabled
                  size="small"
                />
              </template>
              <el-button v-else type="primary" link @click="openReviewDialog(row)">
                评价
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

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
        </template>
        <el-empty v-else description="暂无物流信息（待卖家发货）" :image-size="80" />
      </el-card>

      <el-card v-if="order.status >= 1 && order.status !== 4" shadow="never" class="block">
        <template #header>售后记录</template>
        <el-empty v-if="!afterSales.length" description="暂无售后申请" :image-size="64" />
        <el-table v-else :data="afterSales" stripe size="small">
          <el-table-column label="类型" width="100">
            <template #default="{ row }">{{ AFTER_SALE_TYPE[row.type] || row.type }}</template>
          </el-table-column>
          <el-table-column prop="reason" label="原因" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="afterSaleStatusTag(row.status)" size="small">
                {{ AFTER_SALE_STATUS[row.status] || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reply" label="卖家回复" min-width="160" show-overflow-tooltip />
          <el-table-column label="时间" width="165">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-dialog v-model="receiverDialogVisible" title="修改收货信息" width="480px">
      <el-form label-width="88px">
        <el-form-item label="支付方式">
          <el-radio-group v-model="receiverForm.payType">
            <el-radio :value="1">支付宝</el-radio>
            <el-radio :value="2">微信</el-radio>
            <el-radio :value="3">信用卡</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="收货人">
          <el-input v-model="receiverForm.receiverName" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="receiverForm.receiverPhone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="receiverForm.address" type="textarea" :rows="3" placeholder="详细地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiverDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="receiverSaving" @click="handleSaveReceiver">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="商品评价" width="440px">
      <div v-if="reviewTarget" class="review-target">{{ reviewTarget.productName }}</div>
      <el-form label-width="60px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.score" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="reviewForm.content"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="分享你的使用感受（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSaving" @click="handleSubmitReview">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="afterSaleDialogVisible" title="申请售后" width="440px">
      <el-form label-width="88px">
        <el-form-item label="售后类型" required>
          <el-select v-model="afterSaleForm.type" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="opt in afterSaleTypeList"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请原因" required>
          <el-input
            v-model="afterSaleForm.reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请描述问题"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterSaleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="afterSaleSaving" @click="handleApplyAfterSale">提交</el-button>
      </template>
    </el-dialog>
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

.actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.tracks {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.tracks-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.review-target {
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
