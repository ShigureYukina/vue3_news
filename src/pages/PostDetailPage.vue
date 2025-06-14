<template>
  <div class="post-detail-page">
    <el-page-header class="page-header" @back="$router.back()">
    </el-page-header>
    <el-skeleton :rows="10" animated v-if="isLoading"/>

    <el-alert
        v-else-if="error"
        :title="error"
        type="error"
        show-icon
        :closable="false"
        class="mb-4"
    />

    <article
        v-else-if="article"
        class="article-container"
    >
      <header class="article-header">
        <h1 class="article-title">
          {{ article.title }}
        </h1>
        <div class="article-meta">
          <span class="meta-item">
             <el-icon><FolderOpened/></el-icon>
            <router-link
                :to="{ name: 'CategoryPost', params: { categoryName: article.category } }"
                class="meta-link"
            >
              {{ article.category }}
            </router-link>
          </span>
          <span class="meta-item">
            <el-icon><Calendar/></el-icon>
            <span>{{ formattedDate }}</span>
          </span>
          <span class="meta-item" v-if="article.author">
  <el-icon><User/></el-icon>
  <router-link :to="{ name: 'Profile', params: { userId: article.authorId } }" class="meta-link">
    {{ article.author }}
  </router-link>
</span>
          <span class="meta-item">
            <el-icon><View/></el-icon>
            <span>{{ article.views }} 阅读</span>
          </span>
        </div>
      </header>

      <el-image
          v-if="article.imageUrl"
          :src="article.imageUrl"
          :alt="article.title"
          fit="cover"
          class="article-image"
          lazy
      >
        <template #error>
          <div class="image-slot-error-detail">
            <el-icon size="50">
              <Picture/>
            </el-icon>
            <p>图片加载失败</p>
          </div>
        </template>
      </el-image>

      <div
          class="prose article-content"
          v-html="article.fullContent || article.content"
      ></div>

      <div class="interaction-bar">
        <el-button text @click="handleLike" :class="{ 'is-active': isArticleLiked }">
          <el-icon>
            <CaretTop/>
          </el-icon>
          <span>{{ article.likes }} 点赞</span>
        </el-button>
        <el-button text @click="toggleFavorite" :class="{ 'is-active': isArticleFavorite }">
          <el-icon>
            <StarFilled v-if="isArticleFavorite"/>
            <Star v-else/>
          </el-icon>
          <span>{{ article.favorites }} 收藏</span>
        </el-button>
        <el-button text @click="openShareDialog">
          <el-icon>
            <Share/>
          </el-icon>
          <span>分享</span>
        </el-button>
      </div>


      <el-divider class="section-divider"/>

      <section class="comment-section">
        <h2 class="section-title">评论区</h2>
        <el-form :model="commentForm" @submit.prevent="submitComment" ref="commentFormRef" class="comment-form">
          <el-form-item prop="text">
            <el-input
                v-model="commentForm.text"
                type="textarea"
                :rows="3"
                placeholder="发表你的看法..."
                show-word-limit
                maxlength="200"
            />
          </el-form-item>
          <el-form-item class="text-right">
            <el-button type="primary" @click="submitComment" :loading="submittingComment">发表评论</el-button>
          </el-form-item>
        </el-form>

        <div v-if="comments.length > 0" class="comment-list">
          <CommentItem
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              @comment-submitted="handleNewReply"
              @comment-liked="handleCommentLike"
          />
        </div>
        <el-empty v-else description="暂无评论，快来发表第一条评论吧！" class="mt-10"/>
      </section>
    </article>
  </div>
  <el-dialog v-model="shareDialogVisible" title="分享这篇文章" width="500px">
    <p class="mb-4">通过以下链接分享：</p>
    <el-input :value="currentUrl" readonly>
      <template #append>
        <el-button @click="copyUrl">复制链接</el-button>
      </template>
    </el-input>
  </el-dialog>
</template>

<script>
import {mapStores} from "pinia";
import {useGlobalStore} from "@/store/global";
// 重点：引入 userService
import {postService} from "@/services/postService";
import {userService} from "@/services/userService";
import {Picture, Star, StarFilled, Share, CaretTop, Calendar, User, View, FolderOpened} from "@element-plus/icons-vue";
import CommentItem from "@/components/CommentItem.vue";

export default {
  name: "PostDetailPage",
  components: {
    Picture, Star, StarFilled, Share, CaretTop, Calendar, User, View, FolderOpened,
    CommentItem
  },
  props: ["id"],
  data() {
    return {
      article: null,
      isLoading: true,
      error: null,
      commentForm: {text: ""},
      comments: [],
      submittingComment: false,
      shareDialogVisible: false,
      isFavorited: false,
      isLiked: false,
    };
  },
  computed: {
    ...mapStores(useGlobalStore),
    formattedDate() {
      if (!this.article || !this.article.date) return "";
      return new Date(this.article.date).toLocaleDateString("zh-CN", {
        year: "numeric", month: "long", day: "numeric",
      });
    },
    // 核心修改：isArticleFavorite 和 isArticleLiked 现在只依赖 Pinia store
    // Pinia store 是UI状态的直接来源，我们通过方法调用来确保它和后端同步
    isArticleFavorite() {
      return this.article ? this.globalStore.isFavorite(this.article.id) : false;
    },
    isArticleLiked() {
      return this.article ? this.globalStore.isLiked(this.article.id) : false;
    },
    currentUrl() {
      return window.location.href;
    }
  },
  methods: {
    async fetchArticleData() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await postService.getPostById(this.id);
        this.article = response.data;

        // 初始化评论点赞结构
        const ensureCommentProps = (comments) => {
          return comments.map(c => ({
            ...c,
            likes: c.likes || 0,
            replies: c.replies ? ensureCommentProps(c.replies) : []
          }));
        };
        this.comments = ensureCommentProps(this.article.comments || []);

        // 缓存文章数据
        this.globalStore.addCachedPost(this.article);

        // ✅ 同步点赞和收藏状态
        const interaction = userService.getUserPostInteraction(this.globalStore.userId, this.article.id);
        if (interaction.isLiked && !this.globalStore.isLiked(this.article.id)) {
          this.globalStore.toggleLike(this.article.id);
        }
        if (interaction.isFavorited && !this.globalStore.isFavorite(this.article.id)) {
          this.globalStore.toggleFavorite(this.article.id);
        }

      } catch (err) {
        this.error = err.response?.data?.message || "无法加载帖子详情。";
      } finally {
        this.isLoading = false;
      }
    },

    requireAuth() {
      if (!this.globalStore.isAuthenticated) {
        this.globalStore.showMessage("请先登录以继续操作", "warning");
        this.globalStore.setShowLoginModal(true);
        return false;
      }
      return true;
    },

    // --- 核心修改：重构 toggleFavorite 方法 ---
    async toggleFavorite() {
      if (!this.requireAuth() || !this.article) return;
      try {
        // 1. 调用后端服务更新数据
        await userService.toggleUserFavorite(this.globalStore.userId, this.article.id);

        // 2. 更新 Pinia store 来同步UI状态（按钮高亮）
        this.globalStore.toggleFavorite(this.article.id);

        // 3. 从后端重新获取最新的收藏总数并更新到页面
        this.article.favorites = await userService.getPostFavoriteCount(this.article.id);

      } catch (e) {
        this.globalStore.showMessage('操作失败，请稍后重试', 'error');
      }
    },

    // --- 核心修改：重构 handleLike 方法 ---
    async handleLike() {
      if (!this.requireAuth() || !this.article) return;
      try {
        // 1. 调用后端服务更新数据
        await userService.toggleUserLike(this.globalStore.userId, this.article.id);

        // 2. 更新 Pinia store 来同步UI状态（按钮高亮）
        this.globalStore.toggleLike(this.article.id);

        // 3. 从后端重新获取最新的点赞总数并更新到页面
        this.article.likes = await userService.getPostLikeCount(this.article.id);

      } catch(e) {
        this.globalStore.showMessage('操作失败，请稍后重试', 'error');
      }
    },

    // ... 其他方法保持不变 ...
    openShareDialog() {
      this.shareDialogVisible = true;
    },
    async submitComment() {
      if (!this.requireAuth()) return;
      if (!this.commentForm.text.trim()) {
        this.globalStore.showMessage("评论内容不能为空!", "warning");
        return;
      }
      this.submittingComment = true;
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newComment = {
        id: Date.now(),
        author: this.globalStore.username,
        userId: this.globalStore.userId,
        content: this.commentForm.text,
        date: new Date().toLocaleString("zh-CN"),
        avatarSvg: `<svg width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#409eff"></circle><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="white" font-size="12">${this.globalStore.username.charAt(0)}</text></svg>`,
        replies: [],
        likes: 0,
      };
      this.comments.unshift(newComment);
      this.commentForm.text = '';
      this.globalStore.showMessage("评论已提交!", "success");
      this.submittingComment = false;
    },
    handleNewReply({parentId, reply}) {
      const findAndAddReply = (comments, pId, newReply) => {
        for (const comment of comments) {
          if (comment.id === pId) {
            comment.replies.unshift(newReply);
            return true;
          }
          if (comment.replies && comment.replies.length > 0) {
            if (findAndAddReply(comment.replies, pId, newReply)) {
              return true;
            }
          }
        }
        return false;
      };
      findAndAddReply(this.comments, parentId, reply);
    },
    handleCommentLike(commentId) {
      const findAndLike = (comments, cId) => {
        for (const comment of comments) {
          if (comment.id === cId) {
            this.globalStore.toggleCommentLike(cId);
            if (this.globalStore.isCommentLiked(cId)) {
              comment.likes++;
            } else {
              comment.likes--;
            }
            return true;
          }
          if (comment.replies && comment.replies.length > 0) {
            if (findAndLike(comment.replies, cId)) {
              return true;
            }
          }
        }
        return false;
      };
      findAndLike(this.comments, commentId);
    },
    copyUrl() {
      navigator.clipboard.writeText(this.currentUrl).then(() => {
        this.globalStore.showMessage('链接已复制到剪贴板', 'success');
        this.shareDialogVisible = false;
      }).catch(err => {
        console.error('复制失败: ', err);
        this.globalStore.showMessage('复制失败，请手动复制', 'error');
      });
    }
  },
  created() {
    this.fetchArticleData();
  },
  watch: {
    id(newId) {
      if (newId) this.fetchArticleData();
    },
  },
};
</script>

<style scoped>
/* --- Overall Page Layout --- */

.dark .post-detail-page {
  background-color: #111827;
}

.page-header {
  padding: 16px 24px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
}

.dark .page-header {
  background-color: #1f2937;
  border-bottom-color: #374151;
}

/* --- Article --- */
.article-container {
  padding: 20px;
  margin: auto;
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .02), 0 4px 8px rgba(0, 0, 0, .04);
}

.dark .article-container {
  background-color: #1f2937;
  box-shadow: none;
}

.article-header {
  margin-bottom: 24px;
}

.article-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  margin-bottom: 16px;
}

.dark .article-title {
  color: #f9fafb;
}

.article-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  font-size: 0.9rem;
  color: #6b7280;
}

.dark .article-meta {
  color: #d1d5db;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-item .el-icon {
  margin-right: 6px;
  font-size: 1rem;
}

.meta-link {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.meta-link:hover {
  color: var(--el-color-primary);
  text-decoration: underline;
}

.article-image {
  height: 100%;
  border-radius: 8px;
  margin-bottom: 32px;
}

.article-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #374151;
}

.dark .article-content {
  color: #d1d5db;
}

/* --- Interaction Bar --- */
.interaction-bar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 8px;
}

.interaction-bar .el-button {
  font-size: 1rem;
  color: #6b7280;
}

.dark .interaction-bar .el-button {
  color: #d1d5db;
}

.interaction-bar .el-button.is-active {
  color: var(--el-color-primary);
}

/* --- Divider --- */
.section-divider {
  margin: 40px 0;
}

.dark .section-divider {
  border-color: #374151;
}

/* --- Comment Section --- */
.comment-section {
  margin-top: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1f2937;
}

.dark .section-title {
  color: #f9fafb;
}

.comment-list {
  margin-top: 32px;
}
</style>
