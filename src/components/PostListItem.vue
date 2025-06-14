<template>
  <el-card
      class="Post-list-item"
      :body-style="{ padding: '0px' }"
      @click="handleCardClick"
      shadow="hover"
  >
    <div class="card-content-wrapper">
      <div v-if="article.imageUrl" class="image-container">
        <el-image :src="article.imageUrl" fit="cover" class="Post-image">
          <template #error>
            <div class="image-slot-error">
              <el-icon>
                <Picture/>
              </el-icon>
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
      </div>
      <div class="content-container">
        <div class="header">
          <h3 class="title" v-highlight="props.highlightText">
            {{ article.title }}
          </h3>
          <!-- Updated Button with Role-based Logic -->
          <el-button
              v-if="globalStore.isAuthenticated"
              :type="globalStore.isAdmin ? 'danger' : ''"
              :icon="globalStore.isAdmin ? Delete : CloseBold"
              circle
              size="small"
              class="close-button"
              :class="{ 'admin-delete': globalStore.isAdmin }"
              @click.stop="handleCloseOrDeleteClick"
          />
        </div>
        <div v-if="!showFeedbackOptions">
          <div class="meta">
            <el-tag
                v-if="article.category"
                type="primary"
                size="small"
                class="category-tag"
            >{{ article.category }}
            </el-tag
            >
            <span class="date">{{ formatDate(article.date) }}</span>
            <span v-if="article.author" class="author"
            >作者: {{ article.author }}</span
            >
          </div>
          <p class="summary" v-if="article.summary">{{ article.summary }}</p>
          <div class="footer">
            <div class="stats">
              <span><el-icon><View/></el-icon> {{ article.views }}</span>
              <span><el-icon><Pointer/></el-icon> {{ article.likes }}</span>
              <span><el-icon><Star/></el-icon> {{ article.favorites }}</span>
              <span><el-icon><Share/></el-icon> {{ article.shares }}</span>
              <el-tag
                  v-if="isRead"
                  type="info"
                  size="small"
                  effect="light"
                  class="read-tag"
              >已读
              </el-tag
              >
            </div>
            <slot name="actions"></slot>
          </div>
        </div>
        <div v-else class="feedback-options-container">
          <p class="feedback-title">您为什么不喜欢这条新闻？</p>
          <el-radio-group v-model="selectedReason" class="feedback-radios">
            <el-radio :label="'不感兴趣'">不感兴趣</el-radio>
            <el-radio :label="'内容重复'">内容重复</el-radio>
            <el-radio :label="'质量较低'">质量较低</el-radio>
            <el-radio :label="'其他原因'">其他原因</el-radio>
          </el-radio-group>
          <div class="feedback-actions">
            <el-button type="primary" size="small" @click.stop="submitFeedback"
            >提交
            </el-button
            >
            <el-button size="small" @click.stop="cancelFeedback"
            >取消
            </el-button
            >
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import {ref, defineProps, defineEmits} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {
  Picture,
  CloseBold,
  Delete, // Import Delete icon for admin
  View,
  Pointer,
  Star,
  Share,
} from "@element-plus/icons-vue";
import {useGlobalStore} from "@/store/global";

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
  highlightText: {
    type: String,
    default: "",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// Updated emits to include delete-post
const emit = defineEmits(["read-more", "close-Post", "delete-post"]);
const globalStore = useGlobalStore();

const showFeedbackOptions = ref(false);
const selectedReason = ref("");

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "日期无效";
  }
  return date.toLocaleDateString('zh-CN', {timeZone: 'Asia/Taipei'});
};

const handleCardClick = () => {
  if (!showFeedbackOptions.value) {
    emit("read-more", props.article.id);
  }
};

/**
 * @description Handles the click on the top-right button, routing to delete or feedback based on user role.
 */
const handleCloseOrDeleteClick = () => {
  if (globalStore.isAdmin) {
    // Admin action: confirm and delete
    ElMessageBox.confirm(
        '此操作将永久删除该文章，是否继续？',
        '警告',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        }
    ).then(() => {
      emit('delete-post', props.article.id);
      ElMessage({
        type: 'success',
        message: '删除成功',
      });
    }).catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消删除',
      });
    });
  } else {
    // Regular user action: show feedback options
    toggleFeedbackOptions();
  }
};

const toggleFeedbackOptions = () => {
  showFeedbackOptions.value = !showFeedbackOptions.value;
  selectedReason.value = "";
};

const submitFeedback = () => {
  if (!selectedReason.value) {
    ElMessage.warning("请选择一个原因");
    return;
  }
  ElMessage.success(`感谢您的反馈: ${selectedReason.value}`);
  showFeedbackOptions.value = false;
};

const cancelFeedback = () => {
  showFeedbackOptions.value = false;
  selectedReason.value = "";
  ElMessage.info("已取消反馈");
};

const vHighlight = {
  mounted: (el, binding) => {
    const textToHighlight = binding.value;
    if (textToHighlight && el.textContent) {
      const regex = new RegExp(textToHighlight, "gi");
      el.innerHTML = el.textContent.replace(
          regex,
          (match) => `<mark>${match}</mark>`
      );
    }
  },
  updated: (el, binding) => {
    const originalText = props.article.title;
    el.innerHTML = originalText;
    const textToHighlight = binding.value;
    if (textToHighlight && originalText) {
      const regex = new RegExp(textToHighlight, "gi");
      el.innerHTML = originalText.replace(
          regex,
          (match) => `<mark>${match}</mark>`
      );
    }
  },
};
</script>

<style scoped>
.author {
  margin-left: 10px;
  color: #888;
  font-size: 0.85em;
}

.dark .author {
  color: #d1d5db;
}

.Post-list-item {
  margin-bottom: 20px;
  background-color: #ffffff;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.dark .Post-list-item {
  background-color: #1f2937;
}

.Post-list-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .08);
}

.dark .Post-list-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-content-wrapper {
  display: flex;
  cursor: pointer;
}

.image-container {
  width: 180px;
  height: 120px;
  flex-shrink: 0;
  margin-right: 15px;
  overflow: hidden;
  background-color: var(--el-fill-color-lighter);
}

.dark .image-container {
  background-color: #374151;
}

.Post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-slot-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.image-slot-error .el-icon {
  font-size: 30px;
  margin-bottom: 8px;
}

.content-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 15px;
  min-width: 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.title {
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0;
  flex-grow: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .title {
  color: #f9fafb;
}

.close-button {
  flex-shrink: 0;
  background-color: rgba(128, 128, 128, 0.5);
  border-color: transparent;
}

.close-button.admin-delete {
  background-color: var(--el-color-danger-light-9);
}

.meta {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 8px;
}

.dark .meta {
  color: #d1d5db;
}

.category-tag {
  margin-right: 10px;
}

.date {
  margin-right: 10px;
}

.summary {
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .summary {
  color: #d1d5db;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #888;
}

.dark .stats {
  color: #d1d5db;
}

.stats > span {
  display: inline-flex;
  align-items: center;
}

.stats .el-icon {
  margin-right: 4px;
  font-size: 1.1em;
}

.read-tag {
  background-color: #e0e0e0;
  color: #555555;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
}

.dark .read-tag {
  background-color: #374151;
  color: #f9fafb;
}

.feedback-options-container {
  padding-top: 10px;
}

.feedback-title {
  font-size: 0.9rem;
  color: #333;
  margin-bottom: 10px;
}

.dark .feedback-title {
  color: #f9fafb;
}

.feedback-radios .el-radio {
  display: block;
  margin-bottom: 8px;
}

.feedback-actions {
  margin-top: 15px;
  text-align: right;
}

:deep(mark) {
  background-color: yellow;
  color: black;
  padding: 0;
}
</style>
