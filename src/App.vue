<script setup>
import { onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import AuthDialog from './components/AuthDialog.vue'
import { useAuthDialog } from './composables/useAuthDialog'
import { useUser } from './composables/useUser'

const { openAuth } = useAuthDialog()
const { isLoggedIn, displayName, isSeller, isAdmin, fetchCurrentUser, logout } = useUser()

onMounted(() => {
  fetchCurrentUser()
})

async function handleLogout() {
  await logout()
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <nav class="app-nav">
        <div class="nav-left">
          <RouterLink to="/">首页</RouterLink>
          <RouterLink to="/products">商城</RouterLink>
          <RouterLink to="/shops">店铺</RouterLink>
          <RouterLink v-if="isLoggedIn" to="/cart">购物车</RouterLink>
          <RouterLink v-if="isLoggedIn" to="/orders">我的订单</RouterLink>
          <RouterLink v-if="isLoggedIn" to="/after-sales">我的售后</RouterLink>
        </div>
        <div class="nav-right">
          <template v-if="isSeller">
            <RouterLink to="/seller/orders">店铺订单</RouterLink>
            <RouterLink to="/seller/after-sales">店铺售后</RouterLink>
            <RouterLink to="/seller/products">商品管理</RouterLink>
          </template>
          <template v-if="isAdmin">
            <RouterLink to="/admin/categories">分类管理</RouterLink>
            <RouterLink to="/admin/users">用户管理</RouterLink>
          </template>
          <span v-if="isSeller || isAdmin" class="nav-divider" />
          <template v-if="isLoggedIn">
            <el-dropdown trigger="click">
              <span class="user-name">{{ displayName }}</span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <a class="nav-action" @click="openAuth('login')">登录</a>
            <a class="nav-action" @click="openAuth('register')">注册</a>
          </template>
        </div>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <AuthDialog />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.app-header {
  background: #e8eaed;
  border-bottom: 1px solid #d5d8dc;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.app-nav {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
}

.nav-divider {
  width: 1px;
  height: 24px;
  margin: 0 4px;
  background: #d5d8dc;
}

.app-nav a {
  display: inline-block;
  padding: 0 20px;
  height: 56px;
  line-height: 56px;
  font-size: 15px;
  color: #4a4a4a;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.app-nav a:hover {
  color: #409eff;
  background-color: transparent;
}

.app-nav a.router-link-exact-active {
  color: #409eff;
  font-weight: 500;
}

.user-name {
  padding: 0 20px;
  height: 56px;
  line-height: 56px;
  font-size: 15px;
  color: #409eff;
  font-weight: 500;
  cursor: pointer;
}

.app-main {
  flex: 1;
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
</style>
