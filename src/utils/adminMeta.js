export const USER_ROLE = {
  0: '买家',
  1: '卖家',
  2: '管理员',
}

export const USER_STATUS = {
  0: '已封禁',
  1: '正常',
}

export function userStatusTag(status) {
  return status === 1 ? 'success' : 'danger'
}
