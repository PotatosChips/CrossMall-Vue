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

/** 商品评价列表 */
export function getProductReviews(productId) {
  return request.get('/reviews', { params: { productId } })
}

/** 订单下已有评价（买家） */
export function getOrderReviews(orderNo) {
  return request.get('/reviews', { params: { orderNo } })
}

/** 提交评价 */
export function submitReview({ orderNo, productId, score, content }) {
  return request.post('/reviews', formParams({ orderNo, productId, score, content }))
}
