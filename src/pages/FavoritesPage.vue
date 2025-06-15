<template>
  <el-container class="favorites-page-container">
    <el-main>
      <el-page-header @back="goBack" class="page-header">
        <template #content>
          <span class="text-large font-600 mr-3"> 我的收藏 </span>
        </template>
      </el-page-header>

      <el-skeleton :rows="5" animated v-if="isLoading" />

      <div v-else>
        <div v-if="favoritePostsDetails.length > 0" class="Post-list-grid">
          <el-card
              v-for="Post in favoritePostsDetails" :key="Post.id"
              shadow="hover"
              class="Post-card"
          >
            <template #header>
              <div class="card-header">
                <router-link :to="`/post/${Post.id}`" class="Post-title-link">{{
                    Post.title
                  }}
                </router-link>
                <el-button
                    circle
                    type="warning"
                    :icon="Star"
                    @click.stop="store.toggleFavorite(Post.id)"
                />
              </div>
            </template>
            <p class="Post-content">{{ Post.content }}</p>
            <div class="card-footer">
              <time class="time">{{ Post.date }}</time>
              <el-tag size="small">{{ Post.category }}</el-tag>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="您还没有收藏任何新闻"></el-empty>
      </div>
    </el-main>
  </el-container>
</template>
<script setup>
import { ref, onMounted } from "vue"; // 移除了 computed，引入了 ref 和 onMounted
import { useRouter } from "vue-router";
import { useGlobalStore } from "@/store/global";
import { userService } from "@/services/userService"; // 引入 userService
import { postService } from "@/services/postService"; // 引入 postService
import { Star } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus"; // 引入 ElMessage 用于错误提示

const store = useGlobalStore();
const router = useRouter();

// --- 本地状态 ---
// 用于存储获取到的完整收藏文章对象
const favoritePostsDetails = ref([]);
// 用于控制加载动画
const isLoading = ref(true);

// --- 数据获取逻辑 ---
// onMounted 会在组件挂载到页面后执行
onMounted(async () => {
  // 确保我们能获取到当前的用户ID
  if (!store.userId) {
    ElMessage.warning("无法获取用户信息，请先登录");
    isLoading.value = false;
    return;
  }

  try {
    // 步骤 1: 从 userService 获取收藏文章的 ID 列表
    const { data: favoriteIds } = await userService.getFavoritePosts(store.userId);

    if (!favoriteIds || favoriteIds.length === 0) {
      // 如果没有收藏，直接结束
      isLoading.value = false;
      return;
    }

    // 步骤 2: 根据 ID 列表，创建一组获取文章详情的 Promise
    const fetchPromises = favoriteIds.map(id => postService.getPostById(id));

    // 步骤 3: 使用 Promise.all 并行执行所有请求，以提高效率
    const responses = await Promise.all(fetchPromises);

    // 步骤 4: 从每个响应中提取文章数据，并更新到本地状态
    favoritePostsDetails.value = responses.map(res => res.data);

  } catch (error) {
    console.error("获取收藏文章列表失败:", error);
    ElMessage.error("加载收藏列表失败，请稍后重试。");
  } finally {
    // 无论成功或失败，最后都关闭加载动画
    isLoading.value = false;
  }
});

const goBack = () => {
  router.back();
};
</script>
<style scoped>
.favorites-page-container {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.Post-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.Post-card {
  transition: all 0.3s ease;
}

.Post-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.Post-title-link {
  color: var(--el-text-color-primary);
  text-decoration: none;
  font-weight: bold;
}

.Post-title-link:hover {
  color: var(--el-color-primary);
}

.Post-content {
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  height: 65px; /* 限制摘要高度 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
