<template>
  <el-header class="app-header shadow-md">
    <div class="container">
      <div class="logo-title" @click="$router.push('/')">BBS论坛</div>

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
        <el-menu-item v-if="globalStore.isAuthenticated" index="/archived">
          阅读历史
        </el-menu-item>
        <el-menu-item v-if="globalStore.isAuthenticated" index="/favorites">
          <div class="flex items-center">
            <span>我的收藏</span>
            <el-badge
                :value="globalStore.favoriteCount"
                :hidden="globalStore.favoriteCount === 0"
                class="ml-2"
            />
          </div>
        </el-menu-item>
        <el-menu-item index="/about">关于</el-menu-item>
      </el-menu>

      <!-- 用户信息区域 -->
      <div class="header-right">
        <el-dropdown v-if="globalStore.isAuthenticated" trigger="click">
          <div class="user-info-dropdown">
            <!-- 使用用户名首字母作为默认头像 -->
            <el-avatar
                :size="32"
                :src="globalStore.userAvatar || getDefaultAvatar()"
                style="margin-right: 10px;"
                @error="handleAvatarError"
            >
              {{ getInitials() }}
            </el-avatar>
            <!-- 显示用户名 -->
            <span style="color: #ffffff">{{ globalStore.username }}</span>
            <el-icon class="el-icon--right">
              <arrow-down/>
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-if="globalStore.isAdmin" @click="$router.push('/dashboard')">
                <el-icon>
                  <DataLine/>
                </el-icon>
                数据大屏
              </el-dropdown-item>
              <el-dropdown-item @click="$router.push(`/profile/${globalStore.userId}`)">
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

        <div v-else class="user-info-dropdown" @click="globalStore.setShowLoginModal(true)">
          <span style="color: #ffffff">游客 (请登录)</span>
        </div>

        <!-- 主题切换开关 -->
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
          <el-button type="primary" @click="handleLogin" class="auth-button w-full">
            立即登录
          </el-button>
          <div class="user-role-buttons">
            <el-button @click="loginAsUser" class="role-button user mb-2">
              以普通用户身份登录
            </el-button>
          </div>
          <div>
            <el-button @click="loginAsAdmin" class="role-button admin mb-2">
              以管理员的身份登录
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
          <el-button type="primary" @click="handleRegister" class="auth-button w-full">
            立即注册
          </el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGlobalStore } from "../store/global";
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
  ElInput
} from "element-plus";
import { ArrowDown, User, DataLine, SwitchButton } from "@element-plus/icons-vue";
import VerifyCode from "./VerifyCode.vue";
import { userService } from "../services/userService";

const globalStore = useGlobalStore();
const route = useRoute();
const router = useRouter();
const activeRoute = computed(() => route.path);

// 控制登录弹窗显示
const showLoginModal = computed({
  get: () => globalStore.showLoginModal,
  set: (value) => {
    if (value === false) {
      // 如果设置为隐藏登录弹窗，直接调用 store 的方法
      globalStore.setShowLoginModal(value);
    }
  }
});

// 登录相关数据
const isLogin = ref('true'); // 默认显示登录页
const correctCode = ref('');
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

// 模拟以特定角色登录的通用函数
const loginAsRole = async (userId) => {
  try {
    const { data: userProfile } = await userService.getProfile(userId);
    if (userProfile) {
      globalStore.login(userProfile);
      // 登录成功后关闭登录弹窗
      globalStore.setShowLoginModal(false);
      // 跳转到首页
      await router.push('/');
    } else {
      ElNotification({
        title: '错误',
        message: '获取用户信息失败',
        type: 'error'
      });
    }
  } catch (error) {
    console.error("登录失败:", error);
    ElNotification({
      title: '错误',
      message: '登录过程中发生错误',
      type: 'error'
    });
  }
};

// 模拟以普通用户身份登录 (userService 中 ID > 5 的为普通用户)
const loginAsUser = async () => {
  await loginAsRole(10); // 使用 ID 为 10 的用户作为普通用户示例
};

// 模拟以管理员身份登录 (userService 中 ID 1-5 的为管理员)
const loginAsAdmin = async () => {
  await loginAsRole(1); // 使用 ID 为 1 的用户作为管理员示例
};

// 处理登录提交
const handleLogin = () => {
  if (!loginForm.value.verifyCode) {
    ElNotification({
      title: '提示',
      message: '请输入验证码',
      type: 'warning'
    });
    return;
  }
  if (loginForm.value.verifyCode.toLowerCase() !== correctCode.value.toLowerCase()) {
    ElNotification({
      title: '错误',
      message: '验证码不正确，请重试',
      type: 'error'
    });
    return;
  }
  
  // 登录成功后关闭登录弹窗
  globalStore.setShowLoginModal(false);
  ElNotification({
    title: '提示',
    message: '此登录为模拟，请使用下方快捷按钮登录。',
    type: 'info'
  });
};

// 处理注册提交
const handleRegister = () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElNotification({
      title: '错误',
      message: '两次输入的密码不一致',
      type: 'error'
    });
    return;
  }
  ElNotification({
    title: '成功',
    message: '注册成功（模拟）',
    type: 'success'
  });
};

const isDarkMode = computed({
  get() {
    return globalStore.theme === "dark";
  },
  set() {
  },
});

const toggleTheme = () => {
  globalStore.toggleTheme();
};

const handleLogout = async () => {
  globalStore.logout();
  // After logout, redirect to the homepage
  await router.push('/');
};

// 头像加载失败时的处理方法
const handleAvatarError = (event) => {
  console.warn('头像加载失败:', event);
};

// 获取用户名首字母
const getInitials = () => {
  if (!globalStore.username) return 'U'; // 默认值
  const nameParts = globalStore.username.split(' ');
  return nameParts.length > 1
      ? `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`
      : globalStore.username.charAt(0);
};

// 获取默认头像颜色
const getDefaultAvatar = () => {
  return null; // 返回 null 以启用 el-avatar 的文字显示
};
</script>

<style scoped>
/* --- 页面头部布局 --- */
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

.app-menu .el-menu-item {
  border-bottom: 2px solid transparent;
}

.app-menu .el-menu-item:hover {
  background-color: var(--el-color-primary-light-3) !important;
}

.app-menu .el-menu-item.is-active {
  border-bottom-color: var(--el-color-warning) !important;
  background-color: transparent !important;
}

/* 登录弹窗样式 */
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
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #ffffff;
  transition: all 0.3s ease;
}

.auth-button:hover {
  background-color: var(--el-color-primary-light-5);
  border-color: var(--el-color-primary-light-5);
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
