// 全局状态管理模块，使用 Pinia 实现

import { defineStore } from 'pinia';

// 创建并导出全局状态存储
export const useGlobalStore = defineStore('global', {
	// 状态定义
	state: () => ({
		// 用户ID（模拟）
		userId: 'user-' + Math.random().toString(36).substring(2, 9),
		// 消息状态，用于在App.vue中显示提示信息
		message: null, // { text: String, type: String }
		// 主题设置：从localStorage读取或默认为'light'
		theme: localStorage.getItem('news-app-theme') || 'light',
		// 已读新闻ID列表：初始化为空数组（不使用localStorage）
		readNewsIds: [],
		// 缓存新闻列表：初始化为空数组
		cachedNews: [],
	}),
	// 动作方法（修改状态的方法）
	actions: {
		// 显示消息（App.vue 会 watch 这个 message 状态并调用 ElMessage）
		showMessage(text, type = 'info') {
			this.message = { text, type };
			// 不需要在这里 setTimeout 清除，App.vue 的 watch 会处理
		},
		// 清除消息
		clearMessage() {
			this.message = null;
		},
		// 切换主题
		toggleTheme() {
			this.theme = this.theme === 'light' ? 'dark' : 'light';
			if (this.theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
			// 保存主题偏好到localStorage
			localStorage.setItem('news-app-theme', this.theme);
			// 使用 ElMessage 的职责移到 App.vue
			this.showMessage(`主题已切换为 ${this.theme === 'light' ? '明亮' : '暗黑'}模式`);
		},
		// 初始化主题（可以在 App.vue 的 onMounted 中调用）
		initTheme() {
			if (this.theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		},
		// 将新闻标记为已读
		markNewsAsRead(newsId) {
			/**
			 * 将新闻标记为已读
			 * @param {string | number} newsId - 新闻 ID
			 */
			if (!this.readNewsIds.includes(newsId)) {
				this.readNewsIds.push(newsId);
			}
		},
		// 检查新闻是否已读
		isNewsRead(newsId) {
			/**
			 * 检查新闻是否已读
			 * @param {string | number} newsId - 新闻 ID
			 * @returns {boolean} - 如果新闻已读则返回 true，否则返回 false
			 */
			return this.readNewsIds.includes(newsId);
		},
		// 添加缓存新闻
		addCachedNews(news) {
			/**
			 * 将新闻加入缓存
			 * @param {Object} news - 要加入缓存的新闻对象
			 */
			if (!this.cachedNews.some(item => item.id === news.id)) {
				this.cachedNews.push(news);
			}
		},
		// 获取缓存新闻
		getCachedNews() {
			/**
			 * 获取所有缓存的新闻
			 * @returns {Array} - 缓存的新闻数组
			 */
			return this.cachedNews;
		}
	}
});