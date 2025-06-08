<template>
  <div class="news-detail-page">
    <el-page-header @back="$router.back()"></el-page-header>

    <el-skeleton :rows="10" animated v-if="isLoading" />

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
      class="bg-white p-4 md:p-6 rounded-lg shadow-sm"
    >
      <div class="flex justify-between items-start mb-4">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 flex-grow pr-4">
          {{ article.title }}
        </h1>
        <!-- 新增: 收藏按钮 -->
        <el-button
          circle
          size="large"
          @click="toggleFavorite"
          :type="isArticleFavorite ? 'warning' : 'info'"
          :title="isArticleFavorite ? '取消收藏' : '点击收藏'"
          class="flex-shrink-0"
        >
          <el-icon :size="20"
            ><StarFilled v-if="isArticleFavorite" /><Star v-else
          /></el-icon>
        </el-button>
      </div>
      <div class="text-sm text-gray-500 mb-4 flex items-center flex-wrap">
        <el-tag type="info" size="small" class="mr-2 mb-1">
          分类:
          <router-link
            :to="{
              name: 'CategoryNews',
              params: { categoryName: article.category },
            }"
            class="hover:underline"
          >
            {{ article.category }}
          </router-link>
        </el-tag>
        <span class="mr-2 mb-1">发布日期: {{ formattedDate }}</span>
        <span class="mr-2 mb-1" v-if="article.author"
          >作者: {{ article.author }}</span
        >
        <span class="mb-1">阅读量: {{ article.views }}</span>
      </div>

      <el-image
        v-if="article.imageUrl"
        :src="article.imageUrl"
        :alt="article.title"
        fit="contain"
        class="w-full max-h-96 object-cover rounded-lg shadow-md mb-6 bg-gray-100"
        lazy
      >
        <template #error>
          <div class="image-slot-error-detail">
            <el-icon size="50"><Picture /></el-icon>
            <p>图片加载失败</p>
          </div>
        </template>
      </el-image>

      <div
        class="prose max-w-none text-gray-700 leading-relaxed mb-8"
        v-html="article.fullContent || article.content"
      ></div>

      <el-divider />

      <section class="mt-8">
        <h2 class="text-xl font-semibold text-gray-700 mb-4">评论区</h2>
        <el-form
          :model="commentForm"
          @submit.prevent="submitComment"
          ref="commentFormRef"
        >
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
          <el-form-item>
            <el-button
              type="primary"
              @click="submitComment"
              :loading="submittingComment"
              >提交评论</el-button
            >
          </el-form-item>
        </el-form>

        <div v-if="comments.length > 0" class="space-y-4 mt-6">
          <el-card
            v-for="comment in comments"
            :key="comment.id"
            shadow="never"
            class="comment-card"
          >
            <!-- 显示评论内容 -->
            <p class="text-gray-800">{{ comment.content }}</p>
            <!-- 显示评论作者和日期 -->
            <div class="text-xs text-gray-500 mt-2">
              <div class="comment-avatar" v-html="comment.avatarSvg"></div>
              <span class="comment-username">{{ comment.author }}</span>
              <span class="comment-date">{{ comment.date }}</span>
            </div>
          </el-card>
        </div>
        <el-empty
          v-else
          description="暂无评论，快来发表第一条评论吧！"
          class="mt-6"
        />
      </section>
    </article>
  </div>
</template>

<script>
import { mapStores } from "pinia";
import { useGlobalStore } from "../store/global";
import { newsService } from "../services/newsService";
import { Picture, Star, StarFilled } from "@element-plus/icons-vue"; // 引入 Star 和 StarFilled 图标

export default {
  name: "NewsDetailPage",
  components: { Picture, Star, StarFilled }, // 注册图标组件
  props: ["id"],
  data() {
    return {
      article: null,
      isLoading: true,
      error: null,
      commentForm: { text: "" },
      comments: [],
      submittingComment: false,
    };
  },
  computed: {
    ...mapStores(useGlobalStore),
    formattedDate() {
      if (!this.article || !this.article.date) return "";
      return new Date(this.article.date).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    // 新增: 计算属性，判断当前文章是否已收藏
    isArticleFavorite() {
      if (!this.article) return false;
      return this.globalStore.isFavorite(this.article.id);
    },
  },
  methods: {
    async fetchArticleData() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await newsService.getNewsById(this.id);
        this.article = response.data;
        this.comments = this.article.comments || [];
        this.globalStore.addCachedNews(this.article);
      } catch (err) {
        this.error = err.response?.data?.message || "无法加载新闻详情。";
      } finally {
        this.isLoading = false;
      }
    },
    goBack() {
      this.$router.go(-1);
    },
    // 新增: 切换收藏状态的方法
    toggleFavorite() {
      if (this.article) {
        this.globalStore.toggleFavorite(this.article.id);
      }
    },
    async submitComment() {
      if (!this.commentForm.text.trim()) {
        this.globalStore.showMessage("评论内容不能为空!", "warning");
        return;
      }
      this.submittingComment = true;
      // 模拟提交
      await new Promise((resolve) => setTimeout(resolve, 500));
      // multiavatar is not defined. For now, we'll skip it.
      this.comments.unshift({
        id: Date.now(),
        author: "当前用户",
        content: this.commentForm.text,
        date: new Date().toLocaleString("zh-CN"),
        // avatarSvg: multiavatar(Date.now().toString()),
        avatarSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#${Math.floor(
          Math.random() * 16777215
        )
          .toString(16)
          .padStart(6, "0")}"/></svg>`,
      });
      this.commentForm.text = "";
      this.globalStore.showMessage("评论已提交!", "success");
      this.submittingComment = false;
    },
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
/* 页面整体布局样式 */
.news-detail-page {
  background-color: #f9fafb;
}

.dark .news-detail-page {
  background-color: #1f2937; /* 暗色背景 */
  color: #f9fafb; /* 浅色文字 */
}

article.bg-white {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.dark article.bg-white {
  background-color: #1f2937; /* 深色背景 */
  color: #f9fafb; /* 浅色文字 */
}

.text-2xl.md\:text-3xl {
  color: #1f2937;
  line-height: 1.3;
}

.dark .text-2xl.md\:text-3xl {
  color: #f9fafb; /* 浅色文字 */
}

.text-sm.text-gray-500 {
  color: #6b7280;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dark .text-sm.text-gray-500 {
  color: #d1d5db; /* 灰白色文字 */
}

.text-sm.text-gray-500 .el-tag {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
}

.dark .text-sm.text-gray-500 .el-tag {
  background-color: #374151; /* 深色标签背景 */
  color: #f9fafb; /* 浅色文字 */
}

.el-image.max-h-96 {
  border: 1px solid #e5e7eb;
}

.dark .el-image.max-h-96 {
  border-color: #374151; /* 深色边框 */
}

.image-slot-error-detail {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 14px;
}

.dark .image-slot-error-detail {
  background: #1f2937; /* 深色背景 */
  color: #d1d5db; /* 灰白色文字 */
}

.prose {
  font-size: 1.05rem;
  color: #374151;
}

.dark .prose {
  color: #f9fafb; /* 浅色文字 */
}

.prose :where(p):not(:where([class~="not-prose"] *)) {
  margin-top: 1em;
  margin-bottom: 1em;
  line-height: 1.7;
}

.dark .prose :where(p):not(:where([class~="not-prose"] *)) {
  color: #f9fafb; /* 浅色文字 */
}

.prose :where(h2):not(:where([class~="not-prose"] *)) {
  font-size: 1.6em;
  margin-top: 2em;
  margin-bottom: 0.75em;
  color: #111827;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3em;
}

.dark .prose :where(h2):not(:where([class~="not-prose"] *)) {
  color: #f9fafb; /* 浅色文字 */
  border-bottom-color: #374151; /* 深色边框 */
}

.el-divider {
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;
}

.dark .el-divider {
  border-color: #374151; /* 深色边框 */
}

section.mt-8 h2.text-xl {
  color: #1f2937;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--el-color-primary-light-3);
  margin-bottom: 1.5rem;
}

.dark section.mt-8 h2.text-xl {
  color: #f9fafb; /* 浅色文字 */
  border-bottom-color: #374151; /* 深色边框 */
}

.el-form-item {
  margin-bottom: 1.25rem;
}

.comment-card {
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.dark .comment-card {
  background-color: #1f2937; /* 深色背景 */
  border-color: #374151; /* 深色边框 */
}

.comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.dark .comment-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* 更明显的阴影 */
}

.comment-card p.text-gray-800 {
  color: #374151;
}

.dark .comment-card p.text-gray-800 {
  color: #f9fafb; /* 浅色文字 */
}

.comment-card p.text-xs.text-gray-500 {
  color: #9ca3af;
}

.dark .comment-card p.text-xs.text-gray-500 {
  color: #d1d5db; /* 灰白色文字 */
}

.el-empty {
  margin-top: 2rem;
}

.dark .el-empty {
  background-color: #1f2937; /* 深色背景 */
}

/* 响应式设计调整 */
@media (max-width: 768px) {
  .news-detail-page {
    padding: 0;
  }
  .el-page-header {
    border-radius: 0;
  }
  article.bg-white {
    padding: 1rem;
    border-radius: 0;
    box-shadow: none;
  }
  .text-2xl.md\:text-3xl {
    font-size: 1.6rem;
  }
  .el-image.max-h-96 {
    max-height: 220px;
    margin-bottom: 1rem;
  }
  .prose {
    font-size: 0.95rem;
  }
}

/* 评论头像样式 */
.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
}
</style>
