<template>
  <el-config-provider :locale="locale">
    <el-container class="app-el-container">
      <AppHeader />

      <el-main class="app-main">
        <div class="main-content-wrapper">
          <router-view v-slot="{ Component }">
            <keep-alive include="HomePage,ArchivedNewsPage">
              <component :is="Component"/>
            </keep-alive>
          </router-view>
        </div>
      </el-main>

      <el-footer class="app-footer text-center" height="auto">
        <p>&copy; {{ new Date().getFullYear() }} Vue.js 帖子展示.</p>
        <p class="text-sm">这是一个用于演示 Vue.js 功能的示例网站。</p>
      </el-footer>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useGlobalStore } from "./store/global";
import { ElConfigProvider, ElContainer, ElMain, ElFooter, ElNotification } from "element-plus";
import AppHeader from './components/AppHeader.vue'; // 导入新的 Header 组件

const globalStore = useGlobalStore();

// 监视全局消息，用于显示通知
watch(
    () => globalStore.message,
    (newMessage) => {
      if (newMessage && newMessage.text) {
        ElNotification({
          title: newMessage.type.charAt(0).toUpperCase() + newMessage.type.slice(1),
          message: newMessage.text,
          type: newMessage.type,
          duration: 3000,
          showClose: true,
        });
        globalStore.clearMessage();
      }
    },
    { deep: true }
);

onMounted(() => {
  console.log("根组件 App 已挂载");
  globalStore.initTheme(); // 初始化主题

  // 每次加载都清除登录状态
  if (globalStore.isAuthenticated) {
    globalStore.logout();
  }

  // 显示欢迎信息（如果需要）
  if (!globalStore.message) {
    globalStore.showMessage("欢迎来到 Vue.js 论坛 !", "success");
  }

  const initialLoader = document.querySelector(".initial-loader-overlay");
  if (initialLoader) {
    initialLoader.style.display = "none";
  }
});

</script>

<style scoped>
/* 主要内容区域 */
.app-main {
  flex-grow: 1;
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.main-content-wrapper {
  max-width: 1380px;
  margin: 0 auto;
  background-color: var(--el-bg-color-overlay);
  padding: 20px;
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
}

/* 页面底部 */
.app-footer {
  padding: 20px;
  background-color: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-light);
}

.app-footer p {
  margin: 5px 0;
}

/* 夜间模式样式 */
.dark .app-main {
  background-color: #1f2937; /* 稍浅的深色背景 */
  color: #f9fafb; /* 浅色文字 */
}

.dark .main-content-wrapper {
  background-color: #374151; /* 更亮一些的深色背景 */
  color: #f9fafb; /* 浅色文字 */
}

.dark .app-footer {
  background-color: #1f2937; /* 深色背景 */
  color: #d1d5db; /* 灰白色文字 */
  border-top-color: #374151; /* 较深的边框 */
}
</style>
