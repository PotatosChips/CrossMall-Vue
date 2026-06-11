<template>
  <div class="success-page">
    <div class="card">
      <!-- 小恐龙 -->
      <div class="dino">
        <div class="body"></div>
        <div class="head"></div>
        <div class="eye"></div>
        <div class="mouth"></div>
        <div class="belly"></div>
        <div class="tail"></div>
        <div class="leg leg1"></div>
        <div class="leg leg2"></div>
      </div>

      <h2>操作成功 ✅</h2>
      <p>{{ msg }}</p>

      <div class="btn-group">
        <el-button type="primary" @click="goHome">
          返回首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const msg = '欢迎回来，登录成功！'

// 返回首页
function goHome() {
  router.push('/')
  ElMessage.success('跳转成功')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f9ff;
}

.card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 360px;
}

/* 小恐龙样式 */
.dino {
  position: relative;
  width: 120px;
  height: 100px;
  margin: 0 auto 20px;
}

.body {
  width: 70px;
  height: 50px;
  background: #68c950;
  border-radius: 50%;
  position: absolute;
  bottom: 0;
  left: 25px;
}

.head {
  width: 45px;
  height: 45px;
  background: #68c950;
  border-radius: 50%;
  position: absolute;
  left: 65px;
  top: 10px;
}

.eye {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  position: absolute;
  right: 8px;
  top: 15px;
}

.mouth {
  width: 12px;
  height: 6px;
  border-bottom: 2px solid #fff;
  border-radius: 50%;
  position: absolute;
  right: 6px;
  top: 25px;
}

.belly {
  width: 40px;
  height: 30px;
  background: #a0e58f;
  border-radius: 50%;
  position: absolute;
  bottom: 2px;
  left: 35px;
}

.tail {
  width: 30px;
  height: 20px;
  background: #68c950;
  border-radius: 50%;
  position: absolute;
  left: 5px;
  bottom: 10px;
}

.leg {
  width: 12px;
  height: 18px;
  background: #58b042;
  border-radius: 6px;
  position: absolute;
  bottom: -8px;
}

.leg1 {
  left: 35px;
}

.leg2 {
  left: 65px;
}

h2 {
  color: #333;
  margin: 10px 0;
}

p {
  color: #666;
  margin-bottom: 24px;
}

.btn-group {
  margin-top: 10px;
}
</style>