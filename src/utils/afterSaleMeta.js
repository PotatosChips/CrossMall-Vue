export const AFTER_SALE_TYPE = {
  1: '退货退款',
  2: '换货',
  3: '投诉',
  4: '仅退款',
}

export const AFTER_SALE_STATUS = {
  0: '待处理',
  1: '处理中',
  2: '已完成',
  3: '已拒绝',
}

export const AFTER_SALE_STATUS_FILTERS = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 0 },
  { label: '处理中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已拒绝', value: 3 },
]

export function afterSaleStatusTag(status) {
  const map = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'info',
  }
  return map[status] ?? 'info'
}

/** 根据订单状态返回可申请的售后类型 */
export function afterSaleTypeOptions(orderStatus) {
  if (orderStatus === 1) {
    return [
      { value: 3, label: AFTER_SALE_TYPE[3] },
      { value: 4, label: AFTER_SALE_TYPE[4] },
    ]
  }
  if (orderStatus === 2 || orderStatus === 3) {
    return [1, 2, 3, 4].map((value) => ({
      value,
      label: AFTER_SALE_TYPE[value],
    }))
  }
  return []
}

export function canApplyAfterSale(order, afterSales) {
  if (!order) return false
  if ([0, 4].includes(order.status)) return false
  if (!afterSaleTypeOptions(order.status).length) return false
  return !afterSales.some((a) => a.status === 0 || a.status === 1)
}

export function matchAfterSaleStatusFilter(row, filter) {
  if (filter === 'all') return true
  return row.status === filter
}
