<template>
  <div class="comment-item">
    <el-card shadow="never" class="comment-card">
      <div class="comment-body">
        <div class="comment-author-avatar" v-html="comment.avatarSvg"></div>
        <div class="comment-content-wrapper">
          <div class="comment-meta">
            <router-link :to="{ name: 'Profile', params: { userId: comment.userId } }" class="comment-author-link">
              <span class="comment-username">{{ comment.author }}</span>
            </router-link>
            <span class="comment-date">{{ comment.date }}</span>
          </div>
          <p class="text-gray-800">{{ comment.content }}</p>
          <div class="comment-actions">
            <el-button
                text
                @click="handleLike"
                :class="{ 'is-liked': isLiked }"
            >
              <el-icon><CaretTop /></el-icon>
              <span>{{ likeCount }}</span>
            </el-button>
            <el-button text @click="showReplyInput = !showReplyInput">
              <el-icon><ChatDotRound /></el-icon>
              <span>回复</span>
            </el-button>
          </div>
        </div>
      </div>

      <!-- Reply Form -->
      <div v-if="showReplyInput" class="reply-form mt-4">
        <el-input
            v-model="replyText"
            type="textarea"
            :rows="2"
            :placeholder="`回复 @${comment.author}`"
            maxlength="200"
            show-word-limit
        />
        <div class="reply-form-actions mt-2 text-right">
          <el-button @click="showReplyInput = false" size="small">取消</el-button>
          <el-button type="primary" @click="handleReplySubmit" size="small" :loading="isSubmitting">提交回复</el-button>
        </div>
      </div>

      <!-- Nested Replies -->
      <div v-if="comment.replies && comment.replies.length > 0" class="comment-replies">
        <CommentItem
            v-for="reply in comment.replies"
            :key="reply.id"
            :comment="reply"
            @comment-submitted="bubbleUpComment"
            @comment-liked="bubbleUpLike"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';
import { useGlobalStore } from '@/store/global';
import { ElMessage } from 'element-plus';
import { CaretTop, ChatDotRound } from "@element-plus/icons-vue";

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['comment-submitted', 'comment-liked']);

const globalStore = useGlobalStore();
const showReplyInput = ref(false);
const replyText = ref('');
const isSubmitting = ref(false);

const requireAuth = () => {
  if (!globalStore.isAuthenticated) {
    globalStore.showMessage('请先登录以继续操作', 'warning');
    globalStore.setShowLoginModal(true);
    return false;
  }
  return true;
};

// --- 点赞相关逻辑 ---
const isLiked = computed(() => {
  // 假设 globalStore 中有 isCommentLiked 方法
  return globalStore.isCommentLiked(props.comment.id);
});

const likeCount = computed(() => {
  return props.comment.likes || 0;
});

const handleLike = () => {
  if (!requireAuth()) return;
  emit('comment-liked', props.comment.id);
};

const bubbleUpLike = (commentId) => {
  emit('comment-liked', commentId);
};
// --- 点赞相关逻辑结束 ---


const handleReplySubmit = async () => {
  if (!requireAuth()) return;
  if (!replyText.value.trim()) {
    ElMessage.warning('回复内容不能为空！');
    return;
  }

  isSubmitting.value = true;
  await new Promise(resolve => setTimeout(resolve, 300));

  const newReply = {
    id: Date.now(),
    author: globalStore.username,
    userId: globalStore.userId,
    content: replyText.value,
    date: new Date().toLocaleString('zh-CN'),
    avatarSvg: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#888"></circle><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="12">${globalStore.username.charAt(0)}</text></svg>`,
    replies: [],
    likes: 0,
  };

  emit('comment-submitted', { parentId: props.comment.id, reply: newReply });

  replyText.value = '';
  showReplyInput.value = false;
  isSubmitting.value = false;
  ElMessage.success('回复成功！');
};

const bubbleUpComment = (payload) => {
  emit('comment-submitted', payload);
};
</script>

<style scoped>
.comment-item {
  margin-top: 1rem;
}

.comment-card {
  background-color: transparent;
  border: none;
}

.dark .comment-card {
  background-color: transparent;
}

.comment-body {
  display: flex;
}

.comment-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content-wrapper {
  flex-grow: 1;
}

.comment-meta {
  display: flex;
  align-items: center;
  margin-bottom: 0.25rem;
}

.comment-username {
  font-weight: 600;
  color: #1f2937;
}

.dark .comment-username {
  color: #f9fafb;
}

.comment-date {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-left: 0.75rem;
}

.text-gray-800 {
  color: #374151;
  margin: 0.5rem 0;
}

.dark .text-gray-800 {
  color: #d1d5db;
}

.comment-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.comment-actions .el-button {
  padding: 0;
  height: auto;
  color: #9ca3af;
}

.comment-actions .el-button:hover {
  color: var(--el-color-primary);
}

.comment-actions .el-button.is-liked {
  color: var(--el-color-primary);
}

.comment-replies {
  margin-top: 1rem;
  padding-left: 2.75rem; /* 32px avatar + 12px margin */
}
</style>
