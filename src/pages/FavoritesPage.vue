<template>
  <el-container class="favorites-page-container">
    <el-main>
      <el-page-header @back="goBack" class="page-header">
        <template #content>
          <div class="flex items-center"></div>
        </template>
      </el-page-header>

      <div v-if="favoritePost.length > 0" class="Post-list-grid">
        <!-- 为了方便，我们直接在这里渲染卡片，您也可以继续使用 PostCard 组件 -->
        <el-card
            v-for="Post in favoritePost"
            :key="Post.id"
            shadow="hover"
            class="Post-card"
        >
          <template #header>
            <div class="card-header">
              <router-link :to="`/Post/${Post.id}`" class="Post-title-link">{{
                  Post.title
                }}
              </router-link>
              <el-button
                  circle
                  :type="store.isFavorite(Post.id) ? 'warning' : 'info'"
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
    </el-main>
  </el-container>
</template>

<script setup>
import {computed} from "vue";
import {useRouter} from "vue-router";
import {useGlobalStore} from "@/store/global";
import {Star, StarFilled} from "@element-plus/icons-vue"; // 引入图标

const store = useGlobalStore();
const router = useRouter();

// 从 store 中获取收藏的新闻列表和数量
const favoritePost = computed(() => store.favoritePost);
const favoriteCount = computed(() => store.favoriteCount);

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
