import request from '@/api/request'

/** 店铺列表 */
export function getShopList(params) {
  return request.get('/shops', { params })
}

/** 店铺详情 */
export function getShopDetail(shopId) {
  return request.get(`/shops/${shopId}`)
}
