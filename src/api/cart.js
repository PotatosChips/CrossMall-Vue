import request from '@/api/request'

/** 加入购物车 */
export function addToCart(productId, quantity) {
  const params = new URLSearchParams()
  params.append('productId', productId)
  params.append('quantity', quantity)
  return request.post('/cart', params)
}

/** 购物车列表 */
export function getCartList() {
  return request.get('/cart')
}

/** 修改数量 */
export function updateCartItem(id, quantity) {
  const params = new URLSearchParams()
  params.append('quantity', quantity)
  return request.put(`/cart/${id}`, params)
}

/** 删除购物车项 */
export function deleteCartItem(id) {
  return request.delete(`/cart/${id}`)
}
