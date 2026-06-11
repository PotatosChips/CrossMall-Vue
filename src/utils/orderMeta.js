export const ORDER_STATUS = {
  0: '待支付',
  1: '已支付',
  2: '已发货',
  3: '已完成',
  4: '已取消',
}

export const PAY_TYPE = {
  1: '支付宝',
  2: '微信',
  3: '信用卡',
}

export const LOGISTICS_STATUS = {
  0: '待发货',
  1: '运输中',
  2: '已签收',
  3: '送到',
}

/** 卖家可更新的物流状态（不可选待发货/已签收） */
export const SELLER_LOGISTICS_STATUS_OPTIONS = [
  { value: 1, label: '运输中' },
  { value: 3, label: '送到' },
]

/** 物流 status=3：卖家已标记送到；status=2：买家已签收 */
export const LOGISTICS_DELIVERED = 3
export const LOGISTICS_SIGNED = 2
export const LOGISTICS_COMPANIES = ['DHL', 'FedEx', 'UPS', 'EMS', '顺丰国际']

/** 卖家订单列表筛选 */
export const SELLER_ORDER_FILTERS = [
  { label: '全部', value: 'all' },
  { label: '待发货', value: 1 },
  { label: '运输中', value: 'shipping' },
  { label: '已送至', value: 'delivered' },
  { label: '已签收', value: 'signed' },
]

export function orderStatusTag(status) {
  const map = {
    0: 'warning',
    1: 'info',
    2: 'primary',
    3: 'success',
    4: 'info',
  }
  return map[status] || 'info'
}

function resolveLogisticsStatus(order) {
  return order?.logisticsStatus ?? order?.logistics?.status
}

/** 买家列表/详情：结合物流状态展示 */
export function buyerOrderStatusLabel(order) {
  const lgStatus = resolveLogisticsStatus(order)
  if (order?.status === 3 || lgStatus === LOGISTICS_SIGNED) {
    return '已完成'
  }
  if (order?.status === 2 && lgStatus === LOGISTICS_DELIVERED) {
    return '已送达'
  }
  if (order?.status === 2 && lgStatus === 1) {
    return '运输中'
  }
  return ORDER_STATUS[order?.status] || order?.status
}

export function buyerOrderStatusTag(order) {
  const lgStatus = resolveLogisticsStatus(order)
  if (order?.status === 3 || lgStatus === LOGISTICS_SIGNED) {
    return 'success'
  }
  if (order?.status === 2 && lgStatus === LOGISTICS_DELIVERED) {
    return 'success'
  }
  if (order?.status === 2 && lgStatus === 1) {
    return 'primary'
  }
  return orderStatusTag(order?.status)
}

function sellerLogisticsStatus(order) {
  return resolveLogisticsStatus(order)
}

/** 卖家列表/详情：送到显示「已送至」，买家确认后显示「已签收」 */
export function sellerOrderStatusLabel(order) {
  const lgStatus = sellerLogisticsStatus(order)
  if (order?.status === 2 && lgStatus === LOGISTICS_DELIVERED) {
    return '已送至'
  }
  if (order?.status === 3 || lgStatus === LOGISTICS_SIGNED) {
    return '已签收'
  }
  return ORDER_STATUS[order?.status] || order?.status
}

export function sellerOrderStatusTag(order) {
  const lgStatus = sellerLogisticsStatus(order)
  if (order?.status === 2 && lgStatus === LOGISTICS_DELIVERED) {
    return 'success'
  }
  if (order?.status === 3 || lgStatus === LOGISTICS_SIGNED) {
    return 'success'
  }
  return orderStatusTag(order?.status)
}

export function matchSellerOrderFilter(order, filter) {
  if (filter === 'all') return true
  if (filter === 1) return order.status === 1
  const lgStatus = sellerLogisticsStatus(order)
  if (filter === 'shipping') {
    return order.status === 2 && lgStatus !== LOGISTICS_DELIVERED
  }
  if (filter === 'delivered') {
    return order.status === 2 && lgStatus === LOGISTICS_DELIVERED
  }
  if (filter === 'signed') {
    return order.status === 3 || lgStatus === LOGISTICS_SIGNED
  }
  return true
}
