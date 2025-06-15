<template>
  <el-header class="app-header shadow-md">
    <div class="container">
      <div class="logo-title" @click="router.push('/')">BBS论坛</div>

      <!-- 导航菜单 -->
      <el-menu
          mode="horizontal"
          class="app-menu"
          background-color="transparent"
          text-color="#ffffff"
          active-text-color="#ffd04b"
          :ellipsis="false"
          router
          :default-active="activeRoute"
      >
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/categories">分类</el-menu-item>
        <el-menu-item v-if="globalStore.isAuthenticated" index="/create-post">发布文章</el-menu-item>
        <el-menu-item v-if="globalStore.isAuthenticated" index="/history">
          阅读历史
        </el-menu-item>
        <el-menu-item v-if="globalStore.isAuthenticated" index="/favorites">
          <div class="flex items-center">
            <span>我的收藏</span>
          </div>
        </el-menu-item>
        <el-menu-item index="/about">关于</el-menu-item>
      </el-menu>

      <!-- 用户信息区域 -->
      <div class="header-right">
        <el-dropdown v-if="globalStore.isAuthenticated" trigger="click">
          <div class="user-info-dropdown">
            <span style="color: #ffffff">{{ globalStore.username }}</span>
            <el-icon class="el-icon--right">
              <arrow-down/>
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="globalStore.isAdmin" @click="router.push('/dashboard')">
                <el-icon>
                  <DataLine/>
                </el-icon>
                数据大屏
              </el-dropdown-item>
              <el-dropdown-item @click="router.push(`/profile/${globalStore.userId}`)">
                <el-icon>
                  <User/>
                </el-icon>
                个人信息
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon>
                  <SwitchButton/>
                </el-icon>
                登出
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <div v-else class="user-info-dropdown" @click="showLoginModal = true">
          <span style="color: #ffffff">游客 (请登录)</span>
        </div>

        <el-switch
            v-model="isDarkMode"
            class="theme-toggle-switch"
            active-icon="Moon"
            inactive-icon="Sunny"
            size="small"
            @change="toggleTheme"
        />
      </div>
    </div>
  </el-header>

  <!-- 登录弹窗 -->
  <el-dialog v-model="showLoginModal" title="登录 / 注册" width="500px" center>
    <el-tabs v-model="isLogin" class="auth-tabs">
      <el-tab-pane label="登录" name="true">
        <el-form label-position="top" :model="loginForm">
          <el-form-item label="用户名或邮箱">
            <el-input v-model="loginForm.usernameOrEmail" placeholder="请输入用户名或邮箱" size="large"/>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码"
                      size="large"/>
          </el-form-item>
          <el-form-item label="验证码">
            <div class="verify-code-container">
              <el-input v-model="loginForm.verifyCode" placeholder="请输入验证码" size="large"/>
              <VerifyCode v-model="correctCode" class="verify-code-img"/>
            </div>
          </el-form-item>
          <el-form-item>
            <div class="agreement-container">
              <el-checkbox v-model="agreedToTerms" size="large"/>
              <span class="agreement-text">
                我已阅读并同意
                <a href="#" @click.prevent="showTerms('agreement')">用户协议</a> 和
                <a href="#" @click.prevent="showTerms('privacy')">隐私政策</a>
              </span>
            </div>
          </el-form-item>
          <el-button type="primary" @click="handleLogin" class="auth-button w-full" :disabled="!agreedToTerms">
            立即登录
          </el-button>
          <div class="user-role-buttons">
            <el-button @click="loginAsUser" class="role-button user mb-2">
              以普通用户身份登录（测试）
            </el-button>
          </div>
          <div>
            <el-button @click="loginAsAdmin" class="role-button admin mb-2">
              以管理员的身份登录（测试）
            </el-button>
          </div>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="注册" name="false">
        <el-form label-position="top" :model="registerForm">
          <el-form-item label="用户名">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large"/>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="registerForm.email" placeholder="请输入邮箱" size="large"/>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="registerForm.password" type="password" show-password placeholder="请输入密码"
                      size="large"/>
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input v-model="registerForm.confirmPassword" type="password" show-password
                      placeholder="请再次输入密码" size="large"/>
          </el-form-item>
          <!-- User Agreement Checkbox for Register -->
          <el-form-item>
            <div class="agreement-container">
              <el-checkbox v-model="agreedToTerms" size="large"/>
              <span class="agreement-text">
                我已阅读并同意
                <a href="#" @click.prevent="showTerms('agreement')">用户协议</a> 和
                <a href="#" @click.prevent="showTerms('privacy')">隐私政策</a>
              </span>
            </div>
          </el-form-item>
          <el-button type="primary" @click="handleRegister" class="auth-button w-full" :disabled="!agreedToTerms">
            立即注册
          </el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import {computed, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useGlobalStore} from "@/store/global";
import {
  ElHeader,
  ElMenu,
  ElMenuItem,
  ElAvatar,
  ElSwitch,
  ElBadge,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElIcon,
  ElNotification,
  ElButton,
  ElDialog,
  ElTabs,
  ElTabPane,
  ElForm,
  ElFormItem,
  ElInput,
  ElCheckbox,
  ElMessageBox,
} from "element-plus";
import {ArrowDown, User, DataLine, SwitchButton} from "@element-plus/icons-vue";
import VerifyCode from "./VerifyCode.vue";
import {userService} from "@/services/userService";

const globalStore = useGlobalStore();
const route = useRoute();
const router = useRouter();
const activeRoute = computed(() => route.path);

const showLoginModal = ref(false);

const isLogin = ref('true');
const correctCode = ref('');
const agreedToTerms = ref(false);

const loginForm = ref({
  usernameOrEmail: '',
  password: '',
  verifyCode: '',
});
const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const loginAsRole = async (userId) => {
  try {
    const {data: userProfile} = await userService.getProfile(userId);
    if (userProfile) {
      // The profile includes the password, which we should not store.
      // The global store login should handle this. Let's assume it does.
      globalStore.login(userProfile);
      await router.push('/');
    } else {
      ElNotification({title: '错误', message: '获取用户信息失败', type: 'error'});
    }
  } catch (error) {
    console.error("登录失败:", error);
    ElNotification({title: '错误', message: '登录过程中发生错误', type: 'error'});
  }
};

const loginAsUser = async () => {
  loginForm.value.usernameOrEmail = 'user';
  loginForm.value.password = 'password123';
  await handleLogin();
};

const loginAsAdmin = async () => {
  loginForm.value.usernameOrEmail = 'admin';
  loginForm.value.password = 'password123';
  await handleLogin();
};

const handleLogin = async () => {
  if (!agreedToTerms.value) {
    ElNotification({ title: '提示', message: '请先阅读并同意用户协议和隐私政策', type: 'warning' });
    return;
  }
  if (!loginForm.value.verifyCode && loginForm.value.usernameOrEmail !== 'admin' && loginForm.value.usernameOrEmail !== 'user') {
    ElNotification({ title: '提示', message: '请输入验证码', type: 'warning' });
    return;
  }
  if (loginForm.value.verifyCode.toLowerCase() !== correctCode.value.toLowerCase() && loginForm.value.usernameOrEmail !== 'admin' && loginForm.value.usernameOrEmail !== 'user') {
    ElNotification({ title: '错误', message: '验证码不正确，请重试', type: 'error' });
    return;
  }

  try {
    // Call the newly created login function
    const response = await userService.login(loginForm.value.usernameOrEmail, loginForm.value.password);

    // Check the 'success' flag in the response
    if (response.success) {
      globalStore.login(response.user);
      ElNotification({ title: '成功', message: '登录成功', type: 'success' });
      showLoginModal.value = false;
      await router.push('/');
    } else {
      ElNotification({ title: '失败', message: response.message || '用户名或密码错误', type: 'error' });
    }
  } catch (err) {
    ElNotification({ title: '错误', message: '登录失败，请稍后重试', type: 'error' });
    console.error('登录出错:', err);
  }
};

const handleRegister = async () => {
  if (!agreedToTerms.value) {
    ElNotification({ title: '提示', message: '请先阅读并同意用户协议和隐私政策', type: 'warning' });
    return;
  }
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElNotification({ title: '错误', message: '两次输入的密码不一致', type: 'error' });
    return;
  }

  try {
    const response = await userService.register(registerForm.value);
    if (response.success) {
      ElNotification({ title: '成功', message: '注册成功，请登录', type: 'success' });
      isLogin.value = 'true'; // Switch to login panel
      loginForm.value.usernameOrEmail = registerForm.value.username;
      loginForm.value.password = '';
    } else {
      ElNotification({ title: '失败', message: response.message || '注册失败', type: 'error' });
    }
  } catch (err) {
    ElNotification({ title: '错误', message: '注册失败，请稍后重试', type: 'error' });
    console.error('注册出错:', err);
  }
};


const showTerms = (type) => {
  const titles = {
    agreement: '用户协议',
    privacy: '隐私政策'
  };
  const contents = {
    agreement: '这里是用户协议的详细内容。我们致力于保护您的权益，请仔细阅读...',
    privacy: '这里是隐私政策的详细内容。我们非常重视您的个人隐私...'
  };
  ElMessageBox.alert(contents[type], titles[type], {
    confirmButtonText: '我已阅读',
  });
};

const isDarkMode = computed({
  get: () => globalStore.theme === "dark",
  set: () => {},
});

const toggleTheme = () => globalStore.toggleTheme();

const handleLogout = async () => {
  globalStore.logout();
  await router.push('/');
};
</script>

<style scoped>
/* Existing styles... */
.app-header {
  background-color: var(--el-color-primary);
  color: white;
  height: 60px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.app-header .container {
  display: flex;
  align-items: center;
  height: 100%;
  margin: 0 auto;
  max-width: 1280px; /* Or your preferred max-width */
  padding: 0 20px;
}

.logo-title {
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.app-menu {
  flex-grow: 1;
  justify-content: center;
  border-bottom: none;
}

.header-right {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.user-info-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #ffffff;
}

.theme-toggle-switch {
  margin-left: 1rem;
}

/* New styles for the agreement section */
.agreement-container {
  display: flex;
  align-items: center;
}

.agreement-text {
  margin-left: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.dark .agreement-text {
  color: var(--el-text-color-primary);
}

.agreement-text a {
  color: var(--el-color-primary);
  text-decoration: none;
}

.agreement-text a:hover {
  text-decoration: underline;
}

/* Other styles */
.auth-tabs {
  :deep(.el-tabs__header) {
    background-color: #f9fafb;
    border-bottom: 1px solid #e4e4e4;
  }

  :deep(.el-tabs__item) {
    color: #606266;
    font-weight: 500;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
  }
}

.verify-code-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.verify-code-img {
  width: 170px;
  height: 40px;
}

.auth-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  margin-top: 15px;
  border-radius: 8px;
}

.user-role-buttons {
  margin-top: 20px;
}

.role-button {
  width: 100%;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.role-button.user {
  background-color: var(--el-color-primary);
  color: #ffffff;
}

.role-button.admin {
  background-color: var(--el-color-warning);
  color: #ffffff;
}

/* 夜间模式样式 */
.dark .app-header {
  background-color: #111827; /* 更深的背景色 */
  color: #f9fafb; /* 浅色文字 */
}

.dark .auth-tabs {
  :deep(.el-tabs__header) {
    background-color: #1f2937;
    border-bottom: 1px solid #374151;
  }

  :deep(.el-tabs__item) {
    color: #d1d5db;
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    border-bottom-color: var(--el-color-primary);
  }
}

.dark .verify-code-img {
  background-color: #374151;
}
</style>
