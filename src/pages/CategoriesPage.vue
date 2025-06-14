<template>
  <div class="categories-page">
    <h1 class="page-title">帖子分类</h1>
    <p class="page-description">浏览我们所有的内容分类，找到您感兴趣的主题。</p>

    <div v-loading="isLoading" element-loading-text="正在加载分类..." class="categories-container">
      <el-empty v-if="!isLoading && categories.length === 0" description="暂无分类信息"></el-empty>

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
          <el-button type="primary" plain size="small" @click="fetchCategories">重试</el-button>
        </template>
      </el-alert>

      <el-row :gutter="20">
        <el-col
            v-for="category in categories"
            :key="category.name"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
        >
          <router-link :to="`/category/${category.name}`" class="category-card-link">
            <el-card class="category-card" shadow="hover">
              <div class="card-content">
                <span class="category-name">{{ category.name }}</span>
                <el-tag type="info" round effect="plain" class="category-count">
                  {{ category.count }} 篇文章
                </el-tag>
              </div>
            </el-card>
          </router-link>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import {postService} from '@/services/postService';
import {ElMessage} from 'element-plus';

const categories = ref([]);
const isLoading = ref(true);
const error = ref(null);

const fetchCategories = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await postService.getCategories();
    categories.value = response.data.sort((a, b) => b.count - a.count); // 按文章数量降序排列
  } catch (err) {
    console.error('获取分类失败:', err);
    error.value = '无法加载分类列表，请稍后重试。';
    ElMessage.error('获取分类失败');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.categories-page {
  padding: 20px;
}

.page-title {
  text-align: center;
  font-size: 2.2rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.page-description {
  text-align: center;
  font-size: 1rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 40px;
}

.categories-container {
  min-height: 300px;
}

.category-card-link {
  text-decoration: none;
  color: inherit;
}

.category-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--el-box-shadow-dark);
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}

.category-name {
  font-size: 1.1rem;
  font-weight: 500;
}

.category-count {
  font-size: 0.85rem;
}
</style>