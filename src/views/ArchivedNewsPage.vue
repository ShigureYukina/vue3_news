<template>
  <div class="archived-news-page">
    <el-page-header title="返回" @back="$router.back()"></el-page-header>

    <el-alert type="info" show-icon :closable="false" class="mb-4 mt-4">
      <p>
        此页面显示您的新闻浏览历史记录。
      </p>
      <p>
        最后同步时间: {{ lastUpdated || "尚未加载" }} | 记录总数:
        {{ archivedItems.length }}
      </p>
    </el-alert>

    <el-skeleton :rows="5" animated v-if="isLoading"/>
    <el-alert
        v-else-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
    />

    <div v-else-if="archivedItems.length > 0" class="space-y-4">
      <el-card v-for="item in archivedItems" :key="item.id" shadow="hover">
        <div class="card-content-flex">
          <div class="news-content-wrapper">
            <router-link
                :to="{ name: 'NewsDetail', params: { id: item.id } }"
                class="no-underline"
            >
              <h4 class="text-md font-semibold mb-2 text-gray-800">{{ item.title }}</h4>
              <p class="text-xs text-gray-500 m-0">
                发布于: {{ item.date }} - {{ item.category }}
              </p>
              <p class="text-xs text-gray-400 m-0 mt-1">
                记录于: {{ item.cachedAt }}
              </p>
            </router-link>
          </div>

          <div v-if="item.imageUrl" class="news-image-wrapper">
            <el-image :src="item.imageUrl" alt="新聞圖片" fit="cover" lazy class="news-image"/>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="暂无历史记录"/>
  </div>
</template>

<script setup>
import {ref, onMounted, onActivated} from "vue";
import {useGlobalStore} from "@/store/global";

// 為 <keep-alive> 的 include/exclude 功能提供名稱
defineOptions({name: "ArchivedNewsPage"});

const archivedItems = ref([]);
const isLoading = ref(true);
const error = ref(null);
const lastUpdated = ref(null);
const internalCounter = ref(0);
const globalStore = useGlobalStore();

async function loadArchivedNews() {
  isLoading.value = true;
  error.value = null;
  try {
    const cachedNews = globalStore.getCachedNews();
    archivedItems.value = cachedNews.slice().reverse();
    lastUpdated.value = new Date().toLocaleString("zh-cn", {hour12: false});
  } catch (err) {
    console.error("加载历史记录失败:", err);
    error.value = "加载历史记录失败，请稍后再试。";
  } finally {
    isLoading.value = false;
  }
}

// 首次進入元件時觸發
onMounted(() => {
  loadArchivedNews();
  internalCounter.value++;
});


onActivated(() => {
  loadArchivedNews();
  internalCounter.value++;
});

</script>

<style scoped>
.card-content-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px; /* 設定內容與圖片間距 */
}

.news-content-wrapper {
  flex: 1; /* 佔滿剩餘空間 */
  min-width: 0; /* 防止文字過長時撐破佈局 */
}

.news-image-wrapper {
  flex-shrink: 0; /* 防止圖片被壓縮 */
}

.news-image {
  width: 150px; /* 調整圖片寬度 */
  height: auto; /* 設定圖片高度 */
  border-radius: 6px;
  display: block; /* 移除圖片底部多餘的空白 */
}

.archived-news-page {
  padding: 1rem;
}

.no-underline {
  text-decoration: none;
}

.space-y-4 > :not([hidden]) ~ :not([hidden]) {
  margin-top: 1rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.mt-4 {
  margin-top: 1rem;
}

.archived-news-page .el-card a {
  color: inherit;
}

.dark .archived-news-page .el-card {
  background-color: #1f2937;
}

.dark .archived-news-page .text-gray-800 {
  color: #f9fafb;
}

.dark .archived-news-page .text-gray-500 {
  color: #9ca3af;
}

.dark .archived-news-page .text-gray-400 {
  color: #6b7280;
}

/* 历史记录专属样式 */
.archived-news-page .el-alert__content {
  display: flex;
  flex-direction: column;
}

.archived-news-page .el-alert__description {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.archived-news-page .el-empty__description {
  font-size: 14px;
  color: var(--el-text-color-placeholder);
}
</style>