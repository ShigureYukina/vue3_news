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
        theme: localStorage.getItem("Post-app-theme") || "light",
        // 已读帖子ID列表
        readPostIds: [],
        // 缓存帖子列表
        cachedPost: [],
        // 收藏的帖子ID列表
        favoritePostIds: [],
        // 点赞的帖子ID列表
        likedPostIds: [],
        // 新增: 控制登录弹窗显示
        showLoginModal: false,
    }),

    // Getters 用于派生状态
    getters: {
        // 新增: 用户是否已登录（经过有效性验证）
        isAuthenticated: (state) => {
            // 验证用户对象的基本结构
            return !!(state.currentUser && state.currentUser.userId && state.currentUser.username);
        },
        // 新增: 检查用户会话是否有效
        isSessionValid: (state) => {
            // 这里可以添加更复杂的验证逻辑，如检查token过期时间等
            return !!(state.currentUser && state.currentUser.userId && state.currentUser.username);
        },
        // 新增: 当前用户是否是管理员
        isAdmin: (state) => state.currentUser?.role === 'admin',
        // 新增: 获取当前用户ID
        userId: (state) => state.currentUser?.userId || `guest-${Math.random().toString(36).substring(2, 9)}`,
        // 新增: 获取当前用户头像
        userAvatar: (state) => state.currentUser?.avatar,
        // 新增: 获取当前用户名
        username: (state) => state.currentUser?.username || '游客',
        // 新增: 获取登录弹窗显示状态
        isLoginModalVisible: (state) => state.showLoginModal,

        isFavorite: (state) => (PostId) => state.favoritePostIds.includes(PostId),
        favoritePost: (state) => state.cachedPost.filter((Post) => state.favoritePostIds.includes(Post.id)),
        favoriteCount: (state) => state.favoritePostIds.length,
        isLiked: (state) => (PostId) => state.likedPostIds.includes(PostId),
    },

    // 动作方法
    actions: {
        // 新增: 用户登录
        login(userData) {
            // 验证用户数据的有效性
            if (!userData || !userData.userId || !userData.username) {
                throw new Error('Invalid user data');
            }
            
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
            localStorage.setItem("Post-app-theme", this.theme);
            this.showMessage(`主题已切换为 ${this.theme === "light" ? "明亮" : "暗黑"}模式`);
        },
        initTheme() {
            document.documentElement.classList.toggle("dark", this.theme === "dark");
        },
        markPostAsRead(PostId) {
            if (!this.readPostIds.includes(PostId)) {
                this.readPostIds.push(PostId);
            }
        },
        isPostRead(PostId) {
            return this.readPostIds.includes(PostId);
        },
        addCachedPost(Post) {
            const PostToAdd = Array.isArray(Post) ? Post : [Post];
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const formattedTime = `${year}/${month}/${day} ${hours}:${minutes}`;

            PostToAdd.forEach((n) => {
                if (n && n.id && !this.cachedPost.some((item) => item.id === n.id)) {
                    const PostWithTimestamp = {
                        ...n,
                        cachedAt: formattedTime,
                    };

                    this.cachedPost.push(PostWithTimestamp);
                }
            });
        },
        getCachedPost() {
            return this.cachedPost;
        },
        toggleFavorite(PostId) {
            const index = this.favoritePostIds.indexOf(PostId);
            if (index > -1) {
                this.favoritePostIds.splice(index, 1);
                this.showMessage("已取消收藏", "warning");
            } else {
                this.favoritePostIds.push(PostId);
                this.showMessage("收藏成功", "success");
            }
        },
        toggleLike(PostId) {
            const index = this.likedPostIds.indexOf(PostId);
            if (index > -1) {
                this.likedPostIds.splice(index, 1);
            } else {
                this.likedPostIds.push(PostId);
                this.showMessage("点赞成功！", "success");
            }
        },
        // 新增: 设置登录弹窗显示状态
        setShowLoginModal(visible) {
          this.showLoginModal = visible;
        },
    },
});