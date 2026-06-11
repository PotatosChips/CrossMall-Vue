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

/** 买家申请售后 */
export function applyAfterSale({ orderNo, type, reason }) {
  return request.post('/after-sales', formParams({ orderNo, type, reason }))
}

/** 买家：我的售后列表 */
export function getMyAfterSales() {
  return request.get('/after-sales')
}

/** 买家：某订单的售后列表 */
export function getOrderAfterSales(orderNo) {
  return request.get('/after-sales', { params: { orderNo } })
}

/** 卖家：本店售后列表 */
export function getSellerAfterSales() {
  return request.get('/after-sales/seller')
}

/** 卖家处理售后 */
export function handleAfterSale(id, { status, reply, company }) {
  return request.put(`/after-sales/${id}/handle`, formParams({ status, reply, company }))
}
