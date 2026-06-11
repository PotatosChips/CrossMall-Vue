<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, updateUserStatus } from '@/api/admin'
import { USER_ROLE, USER_STATUS, userStatusTag } from '@/utils/adminMeta'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'
import BackButton from '@/components/BackButton.vue'

const { openAuth } = useAuthDialog()
const { isAdmin, user, fetchCurrentUser } = useUser()

const loading = ref(false)
const acting = ref(false)
const list = ref([])

function isUnauthorized(err) {
  return err.response?.status === 401
}

function formatTime(t) {
  if (!t) return '-'
  return String(t).replace('T', ' ').slice(0, 19)
}

async function loadList() {
  if (!isAdmin.value) return
  loading.value = true
  try {
    const res = await getAdminUsers()
    list.value = res.data?.list || []
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

function canToggle(row) {
  if (row.role === 2) return false
  if (user.value?.username && row.username === user.value.username) return false
  return true
}

async function handleToggle(row) {
  const nextStatus = row.status === 1 ? 0 : 1
  const action = nextStatus === 0 ? '封禁' : '解封'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.username}」？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  acting.value = true
  try {
    const res = await updateUserStatus(row.id, nextStatus)
    if (res.data?.success) {
      ElMessage.success(`已${action}`)
      await loadList()
    } else {
      ElMessage.error(res.data?.massage || '操作失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '操作失败')
  } finally {
    acting.value = false
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  loadList()
})
</script>

<template>
  <div class="page page-medium" v-loading="loading">
    <BackButton fallback="/" />
    <header class="page-header">
      <h2 class="page-title">用户管理</h2>
    </header>

    <el-alert v-if="!isAdmin" type="warning" show-icon :closable="false">
      请使用管理员账号登录（admin / 123456）
    </el-alert>

    <el-table v-else :data="list" stripe>
      <el-table-column prop="username" label="用户名" min-width="120" />
      <el-table-column prop="nickname" label="昵称" min-width="120" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">{{ USER_ROLE[row.role] ?? row.role }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="userStatusTag(row.status)" size="small">
            {{ USER_STATUS[row.status] ?? row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canToggle(row)"
            :type="row.status === 1 ? 'danger' : 'success'"
            link
            :disabled="acting"
            @click="handleToggle(row)"
          >
            {{ row.status === 1 ? '封禁' : '解封' }}
          </el-button>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
