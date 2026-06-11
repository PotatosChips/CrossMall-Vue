import request from '@/api/request'

function formParams(data) {
  const params = new URLSearchParams()
  Object.entries(data).forEach(([key, val]) => {
    if (val != null && val !== '') {
      params.append(key, val)
    }
  })
  return params
}

/** 卖家商品列表 */
export function getMyProducts(params) {
  return request.get('/seller/products', { params })
}

/** 卖家商品详情 */
export function getMyProduct(productId) {
  return request.get(`/seller/products/${productId}`)
}

/** 新增商品 */
export function addProduct(data) {
  return request.post('/seller/products', formParams(data))
}

/** 更新商品 */
export function updateProduct(productId, data) {
  return request.put(`/seller/products/${productId}`, formParams(data))
}
