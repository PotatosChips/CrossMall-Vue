export function productStatusLabel(status) {
  return status === 1 ? '上架' : '下架'
}

export function productStatusTag(status) {
  return status === 1 ? 'success' : 'info'
}
