<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSellerAfterSales, handleAfterSale } from '@/api/afterSale'
import {
  AFTER_SALE_TYPE,
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_FILTERS,
  afterSaleStatusTag,
  matchAfterSaleStatusFilter,
} from '@/utils/afterSaleMeta'
import { LOGISTICS_COMPANIES } from '@/utils/orderMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'
import BackButton from '@/components/BackButton.vue'

const route = useRoute()
const router = useRouter()
const { openAuth } = useAuthDialog()
const { isSeller, fetchCurrentUser } = useUser()

const loading = ref(false)
const acting = ref(false)
const list = ref([])
const statusFilter = ref('all')
const handleDialogVisible = ref(false)
const currentRow = ref(null)
const handleForm = ref({
  action: 'accept',
  reply: '',
  company: '',
})

const orderNoFilter = computed(() => route.query.orderNo?.trim() || '')

const filteredList = computed(() => {
  let rows = list.value.filter((row) => matchAfterSaleStatusFilter(row, statusFilter.value))
  if (orderNoFilter.value) {
    rows = rows.filter((row) => row.orderNo === orderNoFilter.value)
  }
  return rows
})

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadList() {
  if (!isSeller.value) {
    ElMessage.warning('仅卖家账号可查看')
    return
  }
  loading.value = true
  try {
    const res = await getSellerAfterSales()
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

function openHandleDialog(row, action) {
  currentRow.value = row
  handleForm.value = {
    action,
    reply: row.reply || '',
    company: '',
  }
  handleDialogVisible.value = true
}

function resolveHandleStatus(action) {
  if (action === 'accept') return 1
  if (action === 'complete') return 2
  return 3
}

function handleDialogTitle() {
  const map = { accept: '受理售后', complete: '完成售后', reject: '拒绝售后' }
  return map[handleForm.value.action] || '处理售后'
}

async function submitHandle() {
  const row = currentRow.value
  if (!row) return
  const { action, reply, company } = handleForm.value
  const status = resolveHandleStatus(action)
  if ((status === 2 || status === 3) && !reply?.trim()) {
    ElMessage.warning('请填写回复内容')
    return
  }
  if (status === 2 && row.type === 2 && !company) {
    ElMessage.warning('换货完成请选择物流公司')
    return
  }

  acting.value = true
  try {
    const res = await handleAfterSale(row.id, {
      status,
      reply: reply?.trim() || undefined,
      company: status === 2 && row.type === 2 ? company : undefined,
    })
    if (res.data?.success) {
      ElMessage.success('处理成功')
      handleDialogVisible.value = false
      await loadList()
    } else {
      ElMessage.error(res.data?.massage || '处理失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '处理失败')
  } finally {
    acting.value = false
  }
}

function goOrder(row) {
  router.push(`/seller/orders/${row.orderNo}`)
}

function clearOrderFilter() {
  router.replace({ path: '/seller/after-sales' })
}

onMounted(async () => {
  await fetchCurrentUser()
  loadList()
})
watch(() => route.query.orderNo, loadList)
</script>

<template>
  <div class="page" v-loading="loading">
    <BackButton fallback="/seller/orders" />
    <header class="page-header">
      <h2 class="page-title">店铺售后</h2>
      <el-select v-model="statusFilter" placeholder="筛选状态" style="width: 140px">
        <el-option
          v-for="item in AFTER_SALE_STATUS_FILTERS"
          :key="String(item.value)"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </header>

    <el-alert v-if="!isSeller" type="warning" show-icon :closable="false" class="alert-block">
      请使用卖家账号登录
    </el-alert>

    <el-alert
      v-else-if="orderNoFilter"
      type="info"
      show-icon
      :closable="false"
      class="alert-block"
    >
      当前筛选订单：{{ orderNoFilter }}
      <el-button link type="primary" @click="clearOrderFilter">查看全部</el-button>
    </el-alert>

    <el-empty v-else-if="!loading && filteredList.length === 0" description="暂无售后申请" />

    <el-table v-else :data="filteredList" stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="150" />
      <el-table-column prop="buyerNickname" label="买家" width="100" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ AFTER_SALE_TYPE[row.type] || row.type }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="申请原因" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="afterSaleStatusTag(row.status)" size="small">
            {{ AFTER_SALE_STATUS[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reply" label="回复" min-width="160" show-overflow-tooltip />
      <el-table-column label="申请时间" width="165">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="goOrder(row)">订单</el-button>
          <el-button
            v-if="row.status === 0"
            type="primary"
            link
            @click="openHandleDialog(row, 'accept')"
          >
            受理
          </el-button>
          <el-button
            v-if="row.status === 1"
            type="success"
            link
            @click="openHandleDialog(row, 'complete')"
          >
            完成
          </el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="danger"
            link
            @click="openHandleDialog(row, 'reject')"
          >
            拒绝
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="handleDialogVisible" :title="handleDialogTitle()" width="480px">
      <template v-if="currentRow">
        <el-descriptions :column="1" border size="small" class="descriptions-block">
          <el-descriptions-item label="订单号">{{ currentRow.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ AFTER_SALE_TYPE[currentRow.type] }}
          </el-descriptions-item>
          <el-descriptions-item label="原因">{{ currentRow.reason }}</el-descriptions-item>
        </el-descriptions>

        <el-form label-width="88px" class="form-block">
          <el-form-item
            v-if="handleForm.action === 'complete' && currentRow.type === 2"
            label="物流公司"
            required
          >
            <el-select v-model="handleForm.company" placeholder="换货补发必选" style="width: 100%">
              <el-option v-for="c in LOGISTICS_COMPANIES" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="handleForm.action !== 'accept'"
            label="回复"
            required
          >
            <el-input
              v-model="handleForm.reply"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              placeholder="告知买家处理结果"
            />
          </el-form-item>
          <el-form-item v-else label="备注">
            <el-input
              v-model="handleForm.reply"
              type="textarea"
              :rows="3"
              maxlength="500"
              placeholder="可选，如：已收到申请，正在处理"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="submitHandle">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>
