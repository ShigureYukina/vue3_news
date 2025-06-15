// src/services/userService.js

import Mock from "mockjs";
import multiavatar from "@multiavatar/multiavatar";
import {MOCK_POST_COUNT, MOCK_USER_COUNT} from "@/config";

const R = Mock.Random;

const mockUserFullData = (() => {
    const users = [];
    for (let i = 1; i <= MOCK_USER_COUNT; i++) {
        // Generate favorites list
        const favoritesCount = R.natural(3, 10);
        const favoritePostIds = new Set();
        while (favoritePostIds.size < favoritesCount) {
            favoritePostIds.add(R.natural(1, MOCK_POST_COUNT));
        }

        // Generate liked posts list
        const likesCount = R.natural(5, 15);
        const likedPostIds = new Set();
        while (likedPostIds.size < likesCount) {
            likedPostIds.add(R.natural(1, MOCK_POST_COUNT));
        }

        users.push({
            userId: i,
            username: Mock.mock("@cname"),
            avatar: multiavatar(String(i)),
            role: i <= 5 ? 'admin' : 'user',
            password:R.string('lower', 6, 12), // Using a fixed password for testing
            email: R.email(),
            registrationDate: R.date("yyyy-MM-dd"),
            bio: R.cparagraph(1, 3),
            address: {
                city: R.city(true),
                street: R.cword(3, 5) + "路" + R.natural(1, 100) + "号",
                zipcode: R.zip(),
            },
            stats: {
                articlesRead: R.natural(10, 500),
                commentsMade: R.natural(5, 100),
                likesReceived: R.natural(50, 2000),
                articlesPublished: R.natural(1, 30),
                followers: R.natural(100, 5000),
                following: R.natural(50, 1000),
            },
            favoritePosts: Array.from(favoritePostIds),
            likedPosts: Array.from(likedPostIds),
        });
    }
    // Add a known admin and user for easy testing
    users[0] = {...users[0], password: 'admin', avatar: multiavatar(String(1)),userId: 1, username: 'admin', email: 'admin@example.com', role: 'admin'};
    users[9] = {...users[9],password: 'user', avatar: multiavatar(String(10)), userId: 10, username: 'user', email: 'user@example.com', role: 'user'};

    return users;
})();

const userMap = new Map(mockUserFullData.map((user) => [user.userId, user]));

export const getUserBaseById = (userId) => {
    const id = parseInt(userId, 10);
    const fullProfile = userMap.get(id);

    if (fullProfile) {
        return {
            userId: fullProfile.userId,
            username: fullProfile.username,
            avatar: fullProfile.avatar,
            role: fullProfile.role,
        };
    }

    return {
        userId: id,
        username: "未知用户",
        avatar: multiavatar(String(id)),
        role: 'user',
    };
};

export const userService = {
    /**
     * Handles user login by checking credentials.
     * @param {string} usernameOrEmail
     * @param {string} password
     * @returns {Promise<{success: boolean, message: string, user?: object}>}
     */
    async login(usernameOrEmail, password) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

        const user = mockUserFullData.find(
            u => (u.username === usernameOrEmail || u.email === usernameOrEmail)
        );

        if (user && user.password === password) {
            // In a real app, you'd return a token, not the full user object with password
            const { password, ...userWithoutPassword } = user;
            return { success: true, message: '登录成功', user: userWithoutPassword };
        } else {
            return { success: false, message: '用户名或密码错误' };
        }
    },

    async getProfile(userId) {
        if (!userId) {
            return Promise.reject(new Error("未提供有效的用户ID"));
        }
        await new Promise((resolve) =>
            setTimeout(resolve, 100 + Math.random() * 300)
        );
        const userProfile = userMap.get(parseInt(userId, 10));
        if (userProfile) {
            return {data: userProfile};
        } else {
            return Promise.reject({
                response: {status: 404, data: {message: "用户未找到"}},
            });
        }
    },

    async getFavoritePosts(userId) {
        if (!userId) {
            return Promise.reject(new Error("未提供有效的用户ID"));
        }
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
        const user = userMap.get(parseInt(userId, 10));
        if (user) {
            return {data: user.favoritePosts || []};
        } else {
            return Promise.reject({
                response: {status: 404, data: {message: "用户未找到"}},
            });
        }
    },

    async getPostFavoriteCount(postId) {
        const id = parseInt(postId, 10);
        await new Promise(resolve => setTimeout(resolve, 1));
        let count = 0;
        for (const user of mockUserFullData) {
            if (user.favoritePosts && user.favoritePosts.includes(id)) {
                count++;
            }
        }
        return count;
    },

    async getPostLikeCount(postId) {
        const id = parseInt(postId, 10);
        await new Promise(resolve => setTimeout(resolve, 1));
        let count = 0;
        for (const user of mockUserFullData) {
            if (user.likedPosts && user.likedPosts.includes(id)) {
                count++;
            }
        }
        return count;
    },

    async getUserName(userId) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const user = getUserBaseById(userId);
        return user.username;
    },

    async getUserAvatar(userId) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const user = getUserBaseById(userId);
        return user.avatar;
    },

    getRandomUserId() {
        return R.natural(1, MOCK_USER_COUNT);
    },
    async toggleUserLike(userId, postId) {
        const id = parseInt(userId, 10);
        const pId = parseInt(postId, 10);
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
        const user = userMap.get(id);
        if (user) {
            const index = user.likedPosts.indexOf(pId);
            if (index > -1) {
                user.likedPosts.splice(index, 1);
            } else {
                user.likedPosts.push(pId);
            }
            return {success: true};
        }
        return Promise.reject({message: "用户未找到"});
    },

    async toggleUserFavorite(userId, postId) {
        const id = parseInt(userId, 10);
        const pId = parseInt(postId, 10);
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
        const user = userMap.get(id);
        if (user) {
            const index = user.favoritePosts.indexOf(pId);
            if (index > -1) {
                user.favoritePosts.splice(index, 1);
            } else {
                user.favoritePosts.push(pId);
            }
            return {success: true};
        }
        return Promise.reject({message: "用户未找到"});
    },

    async register({username, email, password}) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Correctly implement async delay

        const doesUsernameExist = mockUserFullData.some(u => u.username === username);
        if (doesUsernameExist) {
            return {success: false, message: '用户名已被占用'};
        }

        const doesEmailExist = mockUserFullData.some(u => u.email === email);
        if (doesEmailExist) {
            return {success: false, message: '邮箱已被占用'};
        }

        const newUserId = mockUserFullData.length + 1;
        const newUser = {
            userId: newUserId,
            username: username,
            avatar: multiavatar(String(newUserId)),
            role: 'user',
            email: email,
            password: password,
            registrationDate: new Date().toISOString().split('T')[0],
            bio: '一个刚刚加入的新伙伴！',
            address: {
                city: R.city(true),
                street: R.cword(3, 5) + "路" + R.natural(1, 100) + "号",
                zipcode: R.zip(),
            },
            stats: {
                articlesRead: 0, commentsMade: 0, likesReceived: 0,
                articlesPublished: 0, followers: 0, following: 0,
            },
            favoritePosts: [],
            likedPosts: [],
        };

        mockUserFullData.push(newUser);
        userMap.set(newUserId, newUser);

        return {success: true, message: '注册成功', user: newUser};
    },

    async updateAvatar(userId, newAvatar) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const user = userMap.get(parseInt(userId, 10));
        if (user) {
            user.avatar = newAvatar;
            console.log(`[mock] 用户 ${userId} 的头像已更新`);
            return true;
        }

        console.warn(`[mock] 用户 ${userId} 不存在，头像更新失败`);
        return false;
    },
    getUserPostInteraction(userId, postId) {
        const user = userMap.get(parseInt(userId, 10));
        if (user) {
            return {
                isLiked: user.likedPosts.includes(postId),
                isFavorited: user.favoritePosts.includes(postId),
            };
        }
        return {
            isLiked: false,
            isFavorited: false,
        };
    }

};