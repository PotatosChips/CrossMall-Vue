<script setup>
import { useRouter } from 'vue-router'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { openAuth } = useAuthDialog()
const { isLoggedIn, displayName } = useUser()

const features = [
  {
    title: '商品展示',
    desc: '汇聚日本、美国、德国等地区商家商品，支持分类筛选、地区筛选、关键词搜索与多种排序方式。',
  },
  {
    title: '购物车管理',
    desc: '将心仪商品加入购物车，支持数量调整与删除，结算后自动生成订单并清空购物车。',
  },
  {
    title: '订单管理',
    desc: '支持模拟支付、卖家发货、物流轨迹追踪、确认收货；买家与卖家均可查看订单详情与状态。',
  },
  {
    title: '跨境服务',
    desc: '已完成商品评价、退货退款、换货、投诉、仅退款等售后流程，并提供店铺浏览与管理员后台。',
  },
]

const backendTech = ['Spring Boot 4', 'MyBatis', 'MySQL 8', 'Redis', 'Spring Security']
const frontendTech = ['Vue 3', 'Vite', 'Vue Router', 'Pinia', 'Element Plus', 'Axios']
</script>

<template>
  <div class="home-page">
    <header class="home-header">
      <h2>跨境商城</h2>
      <div class="header-actions">
        <el-button type="primary" @click="router.push('/products')">进入商城</el-button>
        <el-button v-if="!isLoggedIn" link @click="openAuth('login')">登录</el-button>
        <span v-else class="user-label">{{ displayName }}</span>
      </div>
    </header>

    <el-card class="intro-card" shadow="never">
      <template #header>
        <span class="card-title">网站简介</span>
      </template>
      <p class="intro-text">
        跨境商城是一个基于 Spring Boot + Vue 的在线购物平台，旨在为消费者提供便捷的跨境购物体验。
        平台连接全球不同地区的商家与消费者，通过网页浏览器即可浏览商品、管理订单、完成支付结算。
      </p>
      <p class="intro-text">
        当前已完成用户注册登录、商品与店铺展示、购物车、下单支付、订单物流、商品评价、
        售后处理及管理员后台等核心功能，支持买家、卖家、管理员三类角色协同使用。
      </p>
    </el-card>

    <div class="feature-grid">
      <el-card v-for="item in features" :key="item.title" class="feature-card" shadow="hover">
        <h3 class="feature-title">{{ item.title }}</h3>
        <p class="feature-desc">{{ item.desc }}</p>
      </el-card>
    </div>

    <el-card class="tech-card" shadow="never">
      <template #header>
        <span class="card-title">技术栈</span>
      </template>
      <div class="tech-section">
        <p class="tech-label">后端</p>
        <div class="tech-tags">
          <el-tag v-for="item in backendTech" :key="item">{{ item }}</el-tag>
        </div>
      </div>
      <div class="tech-section">
        <p class="tech-label">前端</p>
        <div class="tech-tags">
          <el-tag v-for="item in frontendTech" :key="item" type="success">{{ item }}</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.intro-card {
  margin-bottom: 20px;
}

.intro-text {
  color: #606266;
  line-height: 1.8;
  margin: 0 0 12px;
}

.intro-text:last-child {
  margin-bottom: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #303133;
}

.feature-desc {
  margin: 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.7;
}

.tech-section + .tech-section {
  margin-top: 16px;
}

.tech-label {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-label {
  color: #409eff;
  font-weight: 500;
}
</style>
