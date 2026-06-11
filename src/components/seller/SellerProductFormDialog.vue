<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCategories } from '@/api/product'
import { addProduct, updateProduct } from '@/api/seller'

const props = defineProps({
  visible: { type: Boolean, default: false },
  product: { type: Object, default: null },
})

const emit = defineEmits(['update:visible', 'saved'])

const categories = ref([])
const loading = ref(false)

const form = ref({
  productName: '',
  categoryName: '',
  price: null,
  stock: 0,
  description: '',
  status: 1,
})

function resetForm() {
  form.value = {
    productName: '',
    categoryName: '',
    price: null,
    stock: 0,
    description: '',
    status: 1,
  }
}

function fillForm(product) {
  form.value = {
    productName: product.productName,
    categoryName: product.categoryName,
    price: product.price,
    stock: product.stock,
    description: product.description || '',
    status: product.status,
  }
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    if (props.product) {
      fillForm(props.product)
    } else {
      resetForm()
    }
  },
)

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data?.list || []
  } catch {
    ElMessage.error('分类加载失败')
  }
}

async function handleSubmit() {
  if (!form.value.productName?.trim()) {
    ElMessage.warning('请输入商品名称')
    return
  }
  if (!form.value.categoryName) {
    ElMessage.warning('请选择分类')
    return
  }
  if (form.value.price == null || form.value.price <= 0) {
    ElMessage.warning('请输入有效价格')
    return
  }
  if (form.value.stock == null || form.value.stock < 0) {
    ElMessage.warning('库存不能为负数')
    return
  }

  loading.value = true
  try {
    const res = props.product
      ? await updateProduct(props.product.id, form.value)
      : await addProduct(form.value)

    if (res.data?.success) {
      ElMessage.success(props.product ? '更新成功' : '新增成功')
      emit('saved')
      emit('update:visible', false)
    } else {
      ElMessage.error(res.data?.massage || '操作失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="product ? '编辑商品' : '新增商品'"
    width="480px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form label-width="80px">
      <el-form-item label="名称" required>
        <el-input v-model="form.productName" maxlength="200" placeholder="商品名称" />
      </el-form-item>
      <el-form-item label="分类" required>
        <el-select v-model="form.categoryName" placeholder="选择分类" style="width: 100%">
          <el-option
            v-for="c in categories"
            :key="c.id"
            :label="c.categoryName"
            :value="c.categoryName"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="价格" required>
        <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" />
      </el-form-item>
      <el-form-item label="库存" required>
        <el-input-number v-model="form.stock" :min="0" :step="1" />
      </el-form-item>
      <el-form-item v-if="product" label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">上架</el-radio>
          <el-radio :value="0">下架</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="商品描述（可选）" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
