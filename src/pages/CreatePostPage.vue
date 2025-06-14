<template>
  <div class="create-post-page">
    <el-page-header :title="pageTitle" @back="$router.back()"></el-page-header>

    <!-- Announcement Component - Hidden for Admins -->
    <Announcement
        v-if="showAnnouncement && !globalStore.isAdmin"
        @close="showAnnouncement = false"
        class="announcement-bar"
    />

    <el-card class="form-container" shadow="never">
      <!-- Admin specific controls -->
      <div v-if="globalStore.isAdmin" class="admin-controls">
        <el-form-item label="发布模式">
          <el-switch
              v-model="isPublishingAnnouncement"
              active-text="发布公告"
              inactive-text="发布帖子"
          />
        </el-form-item>
        
        <!-- 当发布公告时显示公告类型选择器 -->
        
        <el-alert
            v-if="isPublishingAnnouncement"
            title="管理员模式"
            type="warning"
            description="您正在以管理员身份发布一篇新的【公告】。"
            show-icon
            :closable="false"
            style="margin-bottom: 20px;"
        />
        <el-form-item v-if="isPublishingAnnouncement" label="公告类型">
          <el-select v-model="postForm.category" placeholder="请选择公告类型" size="large" style="width: 100%;">
            <el-option
                v-for="type in announcementTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
            />
          </el-select>
        </el-form-item>
      </div>

      <el-form :model="postForm" :rules="rules" ref="postFormRef" label-position="top" @submit.prevent="submitForm">
        <el-form-item label="标题" prop="title">
          <el-input v-model="postForm.title" placeholder="请输入标题" size="large" />
        </el-form-item>

        <!-- Category selection is shown for non-admins or admins in 'article' mode -->
        <el-form-item v-if="!isPublishingAnnouncement" label="帖子分类" prop="category">
          <el-select v-model="postForm.category" placeholder="请选择帖子分类" size="large" style="width: 100%;">
            <el-option
                v-for="cat in categories"
                :key="cat.name"
                :label="`${cat.name} (${cat.count})`"
                :value="cat.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <div id="editor-container" style="border: 1px solid #ccc; border-radius: 4px;"></div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="isSubmitting" size="large">立即发布</el-button>
          <el-button @click="resetForm" size="large">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, computed} from 'vue';
import {useRouter} from 'vue-router';
import {ElMessage, ElAlert, ElSwitch} from 'element-plus';
import {useGlobalStore} from '@/store/global';
import {postService} from '@/services/postService';
import Announcement from '@/components/Announcement.vue';

const router = useRouter();
const globalStore = useGlobalStore();
const postFormRef = ref(null);
let editor = null;

const showAnnouncement = ref(true);
const categories = ref([]);
// Admin switch state. Defaults to true if admin, false otherwise.
const isPublishingAnnouncement = ref(globalStore.isAdmin);

const announcementTypes = [
  { value: '系统公告', label: '系统公告' },
  { value: '活动通知', label: '活动通知' },
  { value: '规则调整', label: '规则调整' },
  { value: '节日祝福', label: '节日祝福' },
  { value: '维护通知', label: '维护通知' }
];

const isAnnouncementMode = computed(() => {
  return globalStore.isAdmin && isPublishingAnnouncement.value;
});

const pageTitle = computed(() => {
  return isPublishingAnnouncement.value ? '发布新公告' : '发布新帖子';
});

const postForm = ref({
  title: '',
  category: '',
  content: '',
});

// Rules are now computed to be dynamic based on user role and mode
const rules = computed(() => {
  const baseRules = {
    title: [{required: true, message: '请输入帖子标题', trigger: 'blur'}],
    content: [{required: true, message: '请输入帖子内容', trigger: 'change'}]
  };

  // 如果是公告模式，不需要分类验证，而是需要公告类型验证
  if (isAnnouncementMode.value) {
    return {
      ...baseRules,
      category: [{required: true, message: '请选择公告类型', trigger: 'change'}]
    };
  }

  // 普通帖子模式下需要分类验证
  return {
    ...baseRules,
    category: [{required: true, message: '请选择帖子分类', trigger: 'change'}]
  };
});

const isSubmitting = ref(false);

const fetchCategories = async () => {
  try {
    const response = await postService.getCategories();
    // Exclude '公告' category from the selection list for all users
    categories.value = response.data.filter(cat => cat.name !== '公告');
  } catch (error) {
    ElMessage.error('无法加载分类列表。');
    console.error('Error fetching categories:', error);
  }
};

onMounted(() => {
  if (!globalStore.isAuthenticated) {
    ElMessage.error('请先登录再发布帖子！');
    router.push('/');
    return;
  }

  // Fetch categories for all users, as admins might want to post normal articles.
  fetchCategories();

  const E = window.wangEditor;
  if (!E) {
    ElMessage.error('编辑器加载失败，请检查网络连接或刷新页面。');
    return;
  }

  editor = new E('#editor-container');
  editor.config.height = 400;
  editor.config.zIndex = 100;
  editor.config.onchange = (html) => {
    postForm.value.content = html;
    postFormRef.value.validateField('content');
  };
  editor.create();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.destroy();
    editor = null;
  }
});

const submitForm = () => {
  postFormRef.value.validate(async (valid) => {
    if (valid) {
      if (editor.txt.text().trim() === '') {
        ElMessage.warning('帖子内容不能为空！');
        return;
      }

      const categoryToPost = isPublishingAnnouncement.value ? '公告' : postForm.value.category;
      if (!categoryToPost) {
        ElMessage.error('请选择一个帖子分类。');
        return;
      }

      isSubmitting.value = true;
      try {
        const newPost = {
          ...postForm.value,
          category: categoryToPost, // Set category based on role/mode
          author: globalStore.username,
          userId: globalStore.userId,
          date: new Date().toISOString(),
          views: 0,
          likes: 0,
          shares: 0,
          comments: [],
        };

        const response = await postService.createPost(newPost);

        ElMessage.success('帖子发布成功！');
        router.push({name: 'PostDetail', params: {id: response.data.id}});

      } catch (error) {
        ElMessage.error('发布失败，请稍后重试。');
        console.error('Error creating post:', error);
      } finally {
        isSubmitting.value = false;
      }
    } else {
      ElMessage.error('请检查表单是否完整。');
      return false;
    }
  });
};

const resetForm = () => {
  postFormRef.value.resetFields();
  if (editor) {
    editor.txt.clear();
  }
};
</script>

<style scoped>
.create-post-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 20px;
}

.announcement-bar {
  margin-top: 20px;
}

.form-container {
  margin-top: 20px;
  padding: 30px;
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.admin-controls {
  padding: 10px;
  background-color: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-7);
  border-radius: 4px;
  margin-bottom: 22px;
}
.dark .admin-controls {
  background-color: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.3);
}

.admin-controls .el-select {
  margin-top: 10px;
}

.dark #editor-container {
  --w-e-toolbar-bg-color: #374151;
  --w-e-toolbar-color: #d1d5db;
  --w-e-toolbar-active-color: #fff;
  --w-e-toolbar-active-bg-color: var(--el-color-primary);
  --w-e-textarea-bg-color: #1f2937;
  --w-e-textarea-color: #f9fafb;
  border-color: #4b5563 !important;
}
</style>
