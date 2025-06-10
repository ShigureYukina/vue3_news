// store/global.js

import {defineStore} from "pinia";

// 创建并导出全局状态存储
export const useGlobalStore = defineStore("global", {
    // 状态定义
    state: () => ({
        // 新增: 当前登录的用户信息，null表示未登录
        currentUser: JSON.parse(sessionStorage.getItem("currentUser")) || null,
        // 消息状态，用于在App.vue中显示提示信息
        message: null, // { text: String, type: String }
        // 主题设置
        theme: localStorage.getItem("news-app-theme") || "light",
        // 已读新闻ID列表
        readNewsIds: [],
        // 缓存新闻列表
        cachedNews: [],
        // 收藏的新闻ID列表
        favoriteNewsIds: [],
        // 点赞的新闻ID列表
        likedNewsIds: [],
    }),

    // Getters 用于派生状态
    getters: {
        // 新增: 用户是否已登录
        isAuthenticated: (state) => !!state.currentUser,
        // 新增: 当前用户是否是管理员
        isAdmin: (state) => state.currentUser?.role === 'admin',
        // 新增: 获取当前用户ID
        userId: (state) => state.currentUser?.userId || `guest-${Math.random().toString(36).substring(2, 9)}`,
        // 新增: 获取当前用户头像
        userAvatar: (state) => state.currentUser?.avatar,
        // 新增: 获取当前用户名
        username: (state) => state.currentUser?.username || '游客',

        isFavorite: (state) => (newsId) => state.favoriteNewsIds.includes(newsId),
        favoriteNews: (state) => state.cachedNews.filter((news) => state.favoriteNewsIds.includes(news.id)),
        favoriteCount: (state) => state.favoriteNewsIds.length,
        isLiked: (state) => (newsId) => state.likedNewsIds.includes(newsId),
    },

    // 动作方法
    actions: {
        // 新增: 用户登录
        login(userData) {
            this.currentUser = userData;
            sessionStorage.setItem("currentUser", JSON.stringify(userData)); // 使用 sessionStorage 保持会话
            this.showMessage(`欢迎回来, ${userData.username}!`, "success");
        },
        // 新增: 用户登出
        logout() {
            const username = this.currentUser?.username;
            this.currentUser = null;
            sessionStorage.removeItem("currentUser");
        },

        showMessage(text, type = "info") {
            this.message = {text, type};
        },
        clearMessage() {
            this.message = null;
        },
        toggleTheme() {
            this.theme = this.theme === "light" ? "dark" : "light";
            document.documentElement.classList.toggle("dark", this.theme === "dark");
            localStorage.setItem("news-app-theme", this.theme);
            this.showMessage(`主题已切换为 ${this.theme === "light" ? "明亮" : "暗黑"}模式`);
        },
        initTheme() {
            document.documentElement.classList.toggle("dark", this.theme === "dark");
        },
        markNewsAsRead(newsId) {
            if (!this.readNewsIds.includes(newsId)) {
                this.readNewsIds.push(newsId);
            }
        },
        isNewsRead(newsId) {
            return this.readNewsIds.includes(newsId);
        },
        addCachedNews(news) {
            const newsToAdd = Array.isArray(news) ? news : [news];
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}`;

            newsToAdd.forEach((n) => {
                if (n && n.id && !this.cachedNews.some((item) => item.id === n.id)) {
                    const newsWithTimestamp = {
                        ...n,
                        cachedAt: formattedTime,
                    };

                    this.cachedNews.push(newsWithTimestamp);
                }
            });
        },
        getCachedNews() {
            return this.cachedNews;
        },
        toggleFavorite(newsId) {
            const index = this.favoriteNewsIds.indexOf(newsId);
            if (index > -1) {
                this.favoriteNewsIds.splice(index, 1);
                this.showMessage("已取消收藏", "warning");
            } else {
                this.favoriteNewsIds.push(newsId);
                this.showMessage("收藏成功", "success");
            }
        },
        toggleLike(newsId) {
            const index = this.likedNewsIds.indexOf(newsId);
            if (index > -1) {
                this.likedNewsIds.splice(index, 1);
            } else {
                this.likedNewsIds.push(newsId);
                this.showMessage("点赞成功！", "success");
            }
        },
    },
});