<template>
  <div class="homepage-container">
    <el-row justify="center" class="search-bar">
      <el-col :xs="24" :sm="18" :md="12">
        <el-input
            v-model.trim="searchTerm"
            placeholder="搜索新闻标题或内容..."
            clearable
            size="large"
            @keyup.enter="fetchNewsData"
            @clear="fetchNewsData"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchNewsData"/>
          </template>
        </el-input>
      </el-col>
    </el-row>

    <div
        v-loading="isLoading"
        element-loading-text="正在加载新闻..."
        class="news-list-area"
        style="min-height: 400px"
    >
      <el-empty
          v-if="!isLoading && newsItems.length === 0 && !error"
          :description="
          category
            ? `在 '${category}' 分类下没有找到新闻。`
            : '没有找到符合条件的新闻。'
        "
      />
      <el-alert
          v-if="error"
          :title="error"
          type="error"
          show-icon
          closable
          @close="error = null"
          class="mb-4"
      >
        <template #default>
          <el-button type="primary" plain size="small" @click="fetchNewsData">重试</el-button>
        </template>
      </el-alert>

      <ul v-if="newsItems.length > 0" class="news-list">
        <NewsListItem
            v-for="article in newsItems"
            :key="article.id"
            :article="article"
            :highlight-term="searchTerm"
            :is-read="globalStore.isNewsRead(article.id)"
            @read-more="handleReadMore"
            @close-news="handleCloseNewsItem"
        />
      </ul>
    </div>
  </div>
</template>

<script setup>
import {ref, watch, onMounted} from "vue";
import {useRouter} from "vue-router";
// 确保引用的是最新的 newsService
import {newsService} from "@/services/newsService";
import {useGlobalStore} from "@/store/global";
import NewsListItem from "../components/NewsListItem.vue";
import {Search} from "@element-plus/icons-vue";

defineOptions({name: "HomePage"});
const props = defineProps({category: String});

const router = useRouter();
const globalStore = useGlobalStore();

const newsItems = ref([]);
const searchTerm = ref("");
const error = ref(null);
const isLoading = ref(true);

// ===== 核心修复 3: 重构为单一的数据获取函数, 移除所有分页逻辑 =====
const fetchNewsData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const params = {};
    if (props.category) {
      params.category = props.category;
    }
    // 使用正确的参数名 `searchTerm`
    if (searchTerm.value) {
      params.searchTerm = searchTerm.value;
    }

    // 调用不再支持分页的 getNews 方法
    const response = await newsService.getNews(params);
    newsItems.value = response.data; // 直接用返回的数据替换整个列表

  } catch (err) {
    console.error("获取新闻失败:", err);
    error.value = "无法加载新闻列表，请检查网络或稍后再试。";
    newsItems.value = []; // 出错时清空列表
  } finally {
    isLoading.value = false;
  }
};

// 搜索时调用
// 监听分类变化，重新加载数据
watch(() => props.category, () => {
  searchTerm.value = "";
  fetchNewsData();
});

// 组件挂载时，加载数据
onMounted(() => {
  fetchNewsData();
});

// --- 以下辅助函数保持不变 ---

function handleReadMore(articleId) {
  globalStore.markNewsAsRead(articleId);
  router.push({name: "NewsDetail", params: {id: articleId}});
}

function handleCloseNewsItem(payload) {
  const index = newsItems.value.findIndex(item => item.id === payload.articleId);
  if (index !== -1) {
    newsItems.value.splice(index, 1);
  }
  globalStore.showMessage(
      `新闻 "${payload.articleId}" 已关闭。原因: ${payload.reason || "未提供"}`,
      "info"
  );
}
</script>

<style scoped>
.homepage-container {
  padding: 20px;
}

.search-bar {
  margin-bottom: 24px;
}

.news-list-area {
  margin-top: 24px;
  transition: opacity 0.3s ease;
}

.news-list {
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>