<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { getRegions } from '@/api/product'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useUser } from '@/composables/useUser'

const router = useRouter()
const { visible, mode, closeAuth, switchMode } = useAuthDialog()
const { setUser, fetchCurrentUser } = useUser()

const loginUsername = ref('')
const loginPassword = ref('123456')
const loginLoading = ref(false)

const regUsername = ref('')
const regNickname = ref('')
const regPassword = ref('123456')
const regRole = ref(0)
const merchantName = ref('')
const region = ref('')
const regionOptions = ref([])
const description = ref('')
const regLoading = ref(false)

function resetLoginForm() {
  loginUsername.value = ''
  loginPassword.value = ''
}

function resetRegisterForm() {
  regUsername.value = ''
  regNickname.value = ''
  regPassword.value = '123456'
  regRole.value = 0
  merchantName.value = ''
  region.value = ''
  description.value = ''
}

function handleClose() {
  closeAuth()
}

async function loadRegions() {
  try {
    const res = await getRegions()
    regionOptions.value = res.data?.list || []
  } catch {
    regionOptions.value = []
  }
}

onMounted(loadRegions)

async function handleLogin() {
  if (!loginUsername.value || !loginPassword.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loginLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('username', loginUsername.value)
    params.append('password', loginPassword.value)

    const res = await request.post('/userLogin', params)

    if (res.data.success) {
      if (res.data.token) {
      localStorage.setItem('token', res.data.token)
    }
      setUser(res.data)
      await fetchCurrentUser()
      ElMessage.success('登录成功')
      resetLoginForm()
      closeAuth()
      router.push('/products')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  if (!regUsername.value || !regNickname.value || !regPassword.value) {
    ElMessage.warning('请输入用户名、昵称和密码')
    return
  }
  if (regUsername.value.length > 10) {
    ElMessage.warning('用户名不能超过10个字符')
    return
  }
  if (regPassword.value.length < 6 || regPassword.value.length > 20) {
    ElMessage.warning('密码长度需在6~20个字符之间')
    return
  }
  if (regNickname.value.length > 15) {
    ElMessage.warning('昵称不能超过15个字符')
    return
  }
  if (regRole.value === 1 && (!merchantName.value || !region.value)) {
    ElMessage.warning('商户注册请填写商户名称和地区')
    return
  }
  if (regRole.value === 1 && merchantName.value.length > 15) {
    ElMessage.warning('商户名称不能超过15个字符')
    return
  }
  if (regRole.value === 1 && description.value.length > 500) {
    ElMessage.warning('商户描述不能超过500个字符')
    return
  }

  regLoading.value = true
  try {
    const params = new URLSearchParams()
    params.append('username', regUsername.value)
    params.append('nickname', regNickname.value)
    params.append('password', regPassword.value)
    params.append('role', regRole.value)
    if (regRole.value === 1) {
      params.append('merchantName', merchantName.value)
      params.append('region', region.value)
      params.append('description', description.value)
    }

    const res = await request.post('/userRegister', params)

    if (res.data.success) {
      ElMessage.success('注册成功，请登录')
      resetRegisterForm()
      switchMode('login')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.massage || '注册失败')
  } finally {
    regLoading.value = false
  }
}

function fillDescription() {
  description.value = '这个商户性格内向，什么都不愿意告诉你'
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'login' ? '登录' : '注册'"
    width="420px"
    destroy-on-close
    @close="handleClose"
  >
    <template v-if="mode === 'login'">
      <el-input v-model="loginUsername" placeholder="用户名" style="margin-bottom: 12px" />
      <el-input
        v-model="loginPassword"
        type="password"
        placeholder="密码"
        show-password
        style="margin-bottom: 20px"
        @keyup.enter="handleLogin"
      />
      <el-button type="primary" :loading="loginLoading" style="width: 100%" @click="handleLogin">
        登录
      </el-button>
      <div class="auth-switch">
        没有账号？
        <span class="auth-link" @click="switchMode('register')">立即注册</span>
      </div>
    </template>

    <template v-else>
      <el-input
        v-model="regUsername"
        placeholder="用户名（10字以内）"
        maxlength="10"
        show-word-limit
        style="margin-bottom: 12px"
      />
      <el-input
        v-model="regNickname"
        placeholder="昵称（15字以内）"
        maxlength="15"
        show-word-limit
        style="margin-bottom: 12px"
      />
      <el-input
        v-model="regPassword"
        type="password"
        placeholder="密码（6~20位）"
        maxlength="20"
        show-word-limit
        style="margin-bottom: 12px"
      />
      <el-select v-model="regRole" placeholder="选择角色" style="margin-bottom: 12px; width: 100%">
        <el-option label="普通用户" :value="0" />
        <el-option label="商户" :value="1" />
      </el-select>
      <div v-if="regRole === 1">
        <el-input
          v-model="merchantName"
          placeholder="商户名称（15字以内）"
          maxlength="15"
          show-word-limit
          style="margin-bottom: 12px"
        />
        <el-select v-model="region" placeholder="地区" style="margin-bottom: 12px; width: 100%">
          <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r" />
        </el-select>
        <el-input
          v-model="description"
          type="textarea"
          :rows="3"
          placeholder="商户简介（500字以内，可选）"
          maxlength="500"
          show-word-limit
          style="margin-bottom: 12px"
          @dblclick="fillDescription"
        />
      </div>
      <el-button type="primary" :loading="regLoading" style="width: 100%" @click="handleRegister">
        注册
      </el-button>
      <div class="auth-switch">
        已有账号？
        <span class="auth-link" @click="switchMode('login')">去登录</span>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.auth-switch {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}

.auth-link {
  color: #409eff;
  cursor: pointer;
}
</style>
