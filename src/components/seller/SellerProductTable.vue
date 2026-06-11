<script setup>
import { productStatusLabel, productStatusTag } from '@/utils/productMeta'
import ProductNameLink from '@/components/ProductNameLink.vue'

defineProps({
  products: { type: Array, default: () => [] },
})

const emit = defineEmits(['edit'])
</script>

<template>
  <el-empty v-if="products.length === 0" description="暂无商品，点击右上角新增" />

  <el-table v-else :data="products" stripe>
    <el-table-column label="商品名称" min-width="160" show-overflow-tooltip>
      <template #default="{ row }">
        <ProductNameLink :product-id="row.id" :name="row.productName" />
      </template>
    </el-table-column>
    <el-table-column prop="categoryName" label="分类" width="100" />
    <el-table-column label="价格" width="100">
      <template #default="{ row }">
        <span class="price">¥ {{ row.price }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="stock" label="库存" width="80" />
    <el-table-column label="状态" width="90">
      <template #default="{ row }">
        <el-tag :type="productStatusTag(row.status)" size="small">
          {{ productStatusLabel(row.status) }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="100" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" link @click="emit('edit', row)">编辑</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
