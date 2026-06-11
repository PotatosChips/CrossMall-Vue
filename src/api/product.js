import request from '@/api/request'

/** 商品列表（分页 + 筛选 + 排序） */
export function getProductList(params) {
  return request.get('/products', { params })
}

/** 商品详情 */
export function getProductDetail(id) {
  return request.get(`/products/${id}`)
}

/** 分类列表 */
export function getCategories() {
  return request.get('/categories')
}

/** 商家地区列表 */
export function getRegions() {
  return request.get('/regions')
}
