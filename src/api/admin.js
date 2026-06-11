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

export function addCategory({ categoryName, sort }) {
  return request.post('/admin/categories', formParams({ categoryName, sort }))
}

export function updateCategory(id, { categoryName, sort }) {
  return request.put(`/admin/categories/${id}`, formParams({ categoryName, sort }))
}

export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

export function getAdminUsers() {
  return request.get('/admin/users')
}

export function updateUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, formParams({ status }))
}
