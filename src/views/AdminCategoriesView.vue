<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategories } from '@/api/product'
import { addCategory, updateCategory, deleteCategory } from '@/api/admin'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'

const { openAuth } = useAuthDialog()
const { isAdmin, fetchCurrentUser } = useUser()

const loading = ref(false)
const saving = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const editingId = ref(null)
const form = ref({ categoryName: '', sort: 0 })

function isUnauthorized(err) {
  return err.response?.status === 401
}

async function loadList() {
  if (!isAdmin.value) return
  loading.value = true
  try {
    const res = await getCategories()
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

function openCreate() {
  editingId.value = null
  form.value = { categoryName: '', sort: 0 }
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.value = {
    categoryName: row.categoryName,
    sort: row.sort ?? 0,
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.value.categoryName?.trim()) {
    ElMessage.warning('请填写分类名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      categoryName: form.value.categoryName.trim(),
      sort: form.value.sort,
    }
    const res = editingId.value
      ? await updateCategory(editingId.value, payload)
      : await addCategory(payload)
    if (res.data?.success) {
      ElMessage.success(editingId.value ? '已更新' : '已新增')
      dialogVisible.value = false
      await loadList()
    } else {
      ElMessage.error(res.data?.massage || '保存失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除分类「${row.categoryName}」？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    const res = await deleteCategory(row.id)
    if (res.data?.success) {
      ElMessage.success('已删除')
      await loadList()
    } else {
      ElMessage.error(res.data?.massage || '删除失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '删除失败')
  }
}

onMounted(async () => {
  await fetchCurrentUser()
  loadList()
})
</script>

<template>
  <div class="page" v-loading="loading">
    <header class="page-header">
      <h2>分类管理</h2>
      <el-button v-if="isAdmin" type="primary" @click="openCreate">新增分类</el-button>
    </header>

    <el-alert v-if="!isAdmin" type="warning" show-icon :closable="false">
      请使用管理员账号登录（admin / 123456）
    </el-alert>

    <el-table v-else :data="list" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="categoryName" label="分类名称" min-width="160" />
      <el-table-column prop="sort" label="排序" width="100" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="400px">
      <el-form label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="form.categoryName" maxlength="50" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
