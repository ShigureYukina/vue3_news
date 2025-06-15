import {defineStore} from "pinia";

// 创建并导出全局状态存储
export const useGlobalStore = defineStore("global", {
    // 状态定义
    state: () => ({
        // 当前登录的用户信息，null表示未登录
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
        // 点赞的评论ID列表
        likedCommentIds: [],
        // 控制登录弹窗显示
        showLoginModal: false,
    }),

    // Getters 用于派生状态
    getters: {
        isAuthenticated: (state) => !!(state.currentUser && state.currentUser.userId && state.currentUser.username),
        isSessionValid: (state) => !!(state.currentUser && state.currentUser.userId && state.currentUser.username),
        isAdmin: (state) => state.currentUser?.role === 'admin',
        userId: (state) => state.currentUser?.userId || `guest-${Math.random().toString(36).substring(2, 9)}`,
        userAvatar: (state) => state.currentUser?.avatar,
        username: (state) => state.currentUser?.username || '游客',
        isLoginModalVisible: (state) => state.showLoginModal,
        isFavorite: (state) => (PostId) => state.favoritePostIds.includes(PostId),
        favoritePost: (state) => state.cachedPost.filter((Post) => state.favoritePostIds.includes(Post.id)),
        favoriteCount: (state) => state.favoritePostIds.length,
        isLiked: (state) => (PostId) => state.likedPostIds.includes(PostId),
        isCommentLiked: (state) => (commentId) => state.likedCommentIds.includes(commentId),
    },

    // 动作方法
    actions: {
        login(userData) {
            if (!userData || !userData.userId || !userData.username) {
                throw new Error('Invalid user data');
            }
            this.currentUser = userData;
            sessionStorage.setItem("currentUser", JSON.stringify(userData));
            this.showMessage(`欢迎回来, ${userData.username}!`, "success");
        },
        logout() {
            this.currentUser = null;
            sessionStorage.removeItem("currentUser");
        },

        // --- 新增 Action，用于实现双向绑定 ---
        /**
         * 使用从后端获取的真实数据，同步交互状态
         * @param {object} payload 包含点赞和收藏ID列表的对象, e.g., { likes: [1, 5], favorites: [3, 8] }
         */
        syncInteractionState({ likes, favorites }) {
            // 这个 action 使用后端数据完全覆盖 store 中的旧状态，
            // 确保刷新页面后，UI状态（如高亮按钮）能正确初始化。
            this.likedPostIds = likes || [];
            this.favoritePostIds = favorites || [];
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
                    this.cachedPost.push({ ...n, cachedAt: formattedTime });
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
            } else {
                this.favoritePostIds.push(PostId);
            }
        },
        toggleLike(PostId) {
            const index = this.likedPostIds.indexOf(PostId);
            if (index > -1) {
                this.likedPostIds.splice(index, 1);
            } else {
                this.likedPostIds.push(PostId);
            }
        },
        toggleCommentLike(commentId) {
            const index = this.likedCommentIds.indexOf(commentId);
            if (index > -1) {
                this.likedCommentIds.splice(index, 1);
            } else {
                this.likedCommentIds.push(commentId);
            }
        },
        setShowLoginModal(visible) {
            this.showLoginModal = visible;
        },
    },
});