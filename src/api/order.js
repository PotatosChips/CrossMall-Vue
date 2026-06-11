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

/** 下单 */
export function createOrder({ payType, address, receiverName, receiverPhone }) {
  return request.post('/order', formParams({ payType, address, receiverName, receiverPhone }))
}

/** 订单列表 */
export function getOrderList() {
  return request.get('/order')
}

/** 订单详情 */
export function getOrderDetail(orderNo) {
  return request.get(`/order/${orderNo}`)
}

/** 卖家订单列表 */
export function getSellerOrderList() {
  return request.get('/order/seller')
}

/** 卖家订单详情 */
export function getSellerOrderDetail(orderNo) {
  return request.get(`/order/${orderNo}/seller`)
}

/** 改收货信息 */
export function updateReceiver(orderNo, data) {
  return request.put(`/order/${orderNo}/receiver`, formParams(data))
}

/** 模拟支付 */
export function payOrder(orderNo) {
  return request.post(`/order/${orderNo}/pay`)
}

/** 确认收货 */
export function confirmOrder(orderNo) {
  return request.post(`/order/${orderNo}/confirm`)
}

/** 删除待支付订单 */
export function deleteOrder(orderNo) {
  return request.delete(`/order/${orderNo}`)
}

/** 卖家发货 */
export function shipOrder(orderNo, data) {
  return request.post(`/order/${orderNo}/ship`, formParams(data))
}

/** 卖家更新物流 */
export function updateLogistics(orderNo, data) {
  return request.put(`/order/${orderNo}/logistics`, formParams(data))
}

/** 卖家追加轨迹 */
export function addTrack(orderNo, data) {
  return request.post(`/order/${orderNo}/tracks`, formParams(data))
}
