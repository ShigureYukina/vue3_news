<template>
  <div v-if="showAnnouncement && announcements.length > 0" class="announcement-section">
    <el-card shadow="never" class="announcement-card">
      <template #header>
        <div class="card-header">
          <span><el-icon><DataLine/></el-icon> 社区公告</span>
          <el-button text type="primary" @click="handleClose">关闭</el-button>
        </div>
      </template>

      <div v-if="isLoading" class="announcement-loading">
        <el-skeleton :rows="1" animated/>
      </div>

      <el-carousel v-if="announcements.length > 0" height="50px" direction="vertical" :autoplay="true"
                   indicator-position="none" :interval="5000">
        <el-carousel-item v-for="item in announcements" :key="item.id">
          <div class="announcement-item" @click="goToPost(item.id)">
            <p class="announcement-title">{{ item.title }}</p>
            <span class="announcement-date">{{ formatDate(item.date) }}</span>
          </div>
        </el-carousel-item>
      </el-carousel>

      <!-- Empty State -->
      <div v-else class="announcement-empty">
        <p>暂无最新公告</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {ref, onMounted, defineEmits} from 'vue';
import {useRouter} from 'vue-router';
import {postService} from '@/services/postService';
import {DataLine} from '@element-plus/icons-vue';
import {ElMessage, ElSkeleton, ElMessageBox} from 'element-plus';

const emit = defineEmits(['close']);
const router = useRouter();
const announcements = ref([]);
const isLoading = ref(true);
// 移除了localStorage持久化，改为仅使用响应式变量控制显示
const showAnnouncement = ref(true);

const fetchAnnouncements = async () => {
  isLoading.value = true;
  try {
    const response = await postService.getAnnouncements();
    announcements.value = response.data.slice(0, 3); // 仅显示最新的3条公告
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    ElMessage.error("公告加载失败");
  } finally {
    isLoading.value = false;
  }
};

// 修改关闭方法，移除了localStorage相关代码
const handleClose = () => {
  showAnnouncement.value = false;
  emit('close');
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {month: '2-digit', day: '2-digit'});
};

const goToPost = (id) => {
  router.push({name: 'PostDetail', params: {id}});
};

onMounted(() => {
  fetchAnnouncements();
});
</script>