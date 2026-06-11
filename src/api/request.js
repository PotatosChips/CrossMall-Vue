import axios from 'axios'

// 统一封装 axios，所有接口都走这里
const request = axios.create({
  baseURL: '/api',           // 配合 vite 代理，实际打到 localhost:8080
  timeout: 10000,
  withCredentials: true,     // 关键：让浏览器保存并发送 JSESSIONID Cookie
})

export default request