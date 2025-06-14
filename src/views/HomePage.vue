<template>
  <div class="homepage-container">
    <el-row justify="center" class="search-bar">
      <el-col :xs="24" :sm="18" :md="12">
        <el-input
            v-model.trim="searchTerm"
            placeholder="搜索帖子标题或内容..."
            clearable
            size="large"
            @keyup.enter="fetchPostData"
            @clear="fetchPostData"
        >
          <template #append>
            <el-button :icon="Search" @click="fetchPostData"/>
          </template>
        </el-input>
      </el-col>
    </el-row>

    <div
        v-loading="isLoading"
        element-loading-text="正在加载帖子..."
        class="Post-list-area"
        style="min-height: 400px"
    >
      <el-empty
          v-if="!isLoading && PostItems.length === 0 && !error"
          :description="
          category
            ? `在 '${category}' 分类下没有找到帖子。`
            : '没有找到符合条件的帖子。'
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
          <el-button type="primary" plain size="small" @click="fetchPostData">重试</el-button>
        </template>
      </el-alert>

      <ul v-if="PostItems.length > 0" class="Post-list">
        <PostListItem
            v-for="article in PostItems"
            :key="article.id"
            :article="article"
            :highlight-term="searchTerm"
            :is-read="globalStore.isPostRead(article.id)"
            @read-more="handleReadMore"
            @close-Post="handleClosePostItem"
        />
      </ul>
    </div>
  </div>
</template>

<script setup>
import {ref, watch, onMounted} from "vue";
import {useRouter} from "vue-router";
// 确保引用的是最新的 postService
import {postService} from "@/services/postService";
import {useGlobalStore} from "@/store/global";
import PostListItem from "../components/PostListItem.vue";
import {Search} from "@element-plus/icons-vue";

defineOptions({name: "HomePage"});
const props = defineProps({category: String});

const router = useRouter();
const globalStore = useGlobalStore();

const PostItems = ref([]);
const searchTerm = ref("");
const error = ref(null);
const isLoading = ref(true);

// ===== 核心修复 3: 重构为单一的数据获取函数, 移除所有分页逻辑 =====
const fetchPostData = async () => {
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

    // 调用不再支持分页的 getPost 方法
    const response = await postService.getPost(params);
    PostItems.value = response.data; // 直接用返回的数据替换整个列表

  } catch (err) {
    console.error("获取帖子失败:", err);
    error.value = "无法加载帖子列表，请检查网络或稍后再试。";
    PostItems.value = []; // 出错时清空列表
  } finally {
    isLoading.value = false;
  }
};

// 搜索时调用
// 监听分类变化，重新加载数据
watch(() => props.category, () => {
  searchTerm.value = "";
  fetchPostData();
});

// 组件挂载时，加载数据
onMounted(() => {
  fetchPostData();
});


function handleReadMore(articleId) {
  globalStore.markPostAsRead(articleId);
  router.push({name: "PostDetail", params: {id: articleId}});
}

function handleClosePostItem(payload) {
  const index = PostItems.value.findIndex(item => item.id === payload.articleId);
  if (index !== -1) {
    PostItems.value.splice(index, 1);
  }
  globalStore.showMessage(
      `帖子 "${payload.articleId}" 已关闭。原因: ${payload.reason || "未提供"}`,
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

.Post-list-area {
  margin-top: 24px;
  transition: opacity 0.3s ease;
}

.Post-list {
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>