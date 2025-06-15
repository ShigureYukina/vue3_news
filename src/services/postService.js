// src/services/postService.js
import Mock from "mockjs";
import { userService, getUserBaseById } from "./userService";
import { MOCK_POST_COUNT, MOCK_USER_COUNT } from "@/config";

const R = Mock.Random;

const generateSinglePostItem = (id, specifiedCategory) => {
    const categories = ["技术", "游戏", "财经", "体育", "娱乐", "教育", "健康", "旅游", "时政"];
    const title = Mock.mock("@ctitle(8, 20)");

    const randomAuthorId = Mock.mock(`@integer(1, ${MOCK_USER_COUNT})`);
    const authorInfo = getUserBaseById(randomAuthorId);

    return {
        id: id,
        title: title,
        content: Mock.mock("@csentence(25, 60)"),
        category: specifiedCategory || R.pick(categories),
        date: Mock.mock("@date(yyyy-MM-dd)"),
        imageUrl: `https://placehold.co/600x400/${R.hex().substring(1).toUpperCase()}/${R.hex().substring(1).toUpperCase()}?text=${encodeURIComponent(title.substring(0, 5))}`,
        fullContent: Mock.mock(`@cparagraph(5, 15)`),
        views: Mock.mock("@integer(50, 3000)"),
        authorId: randomAuthorId,
        author: authorInfo.username,
        authorAvatar: authorInfo.avatar,
        shares: Mock.mock("@integer(5, 200)"),
        comments: Mock.mock({ "list|0-5": [{ "userId|1-100": 1, id: "@increment" }]}).list.map((comment) => {
            const user = getUserBaseById(comment.userId);
            return {
                ...comment,
                author: user.username,
                avatarSvg: user.avatar,
                content: Mock.mock("@cparagraph(1, 3)"),
                date: Mock.mock('@datetime("yyyy-MM-dd HH:mm:ss")'),
            };
        }),
    };
};

const mockPostDataStore = await (async () => {
    const data = [];
    for (let i = 1; i <= MOCK_POST_COUNT; i++) {
        const postItem = generateSinglePostItem(i);

        const [favoriteCount, likeCount] = await Promise.all([
            userService.getPostFavoriteCount(i),
            userService.getPostLikeCount(i)
        ]);

        postItem.favorites = favoriteCount;
        postItem.likes = likeCount;

        data.push(postItem);
    }
    console.log("模拟文章数据已生成，点赞和收藏数据已同步。");
    return data;
})();

export const postService = {
    async getPost(params = {}) {
        console.log("Fetching Post with params (Mock.js):", params);
        await new Promise((resolve) =>
            setTimeout(resolve, 100 + Math.random() * 500)
        );

        let PostToReturn = [...mockPostDataStore];

        if (params.category) {
            PostToReturn = PostToReturn.filter(
                (item) => item.category === params.category
            );
        }

        if (params.searchTerm) {
            const term = params.searchTerm.toLowerCase();
            PostToReturn = PostToReturn.filter(
                (item) =>
                    item.title.toLowerCase().includes(term) ||
                    item.content.toLowerCase().includes(term) ||
                    item.fullContent.toLowerCase().includes(term)
            );
        }

        if (params.authorId) {
            PostToReturn = PostToReturn.filter(item => item.authorId == params.authorId);
        }
        return {data: PostToReturn};
    },

    async getPostById(id) {
        const articleId = parseInt(id);
        console.log(`Fetching Post by id (Mock.js): ${articleId}`);
        await new Promise((resolve) =>
            setTimeout(resolve, 150 + Math.random() * 300)
        );

        const article = mockPostDataStore.find((item) => item.id === articleId);

        if (article) {
            article.views = (article.views || 0) + 1;
            return {data: {...article}};
        } else {
            return Promise.reject({
                response: {status: 404, data: {message: "帖子未找到 (Mock.js)"}},
            });
        }
    },

    async getCategories() {
        console.log("Fetching categories (Mock.js)");
        await new Promise((resolve) =>
            setTimeout(resolve, 100 + Math.random() * 200)
        );

        const categoryCounts = mockPostDataStore.reduce((acc, PostItem) => {
            acc[PostItem.category] = (acc[PostItem.category] || 0) + 1;
            return acc;
        }, {});

        const categories = Object.keys(categoryCounts).map((catName) => ({
            name: catName,
            count: categoryCounts[catName],
        }));

        return {data: categories};
    },

    async getAnnouncements() {
        await new Promise((resolve) =>
            setTimeout(resolve, 200 + Math.random() * 300)
        );

        const announcementCategories = ["系统公告", "活动通知", "规则调整", "节日祝福", "维护通知"];
        const randomAnnouncements = Mock.mock({
            "list|3": [{
                id: () => Mock.Random.guid(),
                title: () => Mock.Random.pick(announcementCategories) + ' - ' + Mock.Random.csentence(1, 5),
                date: () => Mock.Random.date('yyyy-MM-dd'),
                content: () => Mock.Random.cparagraph(1)
            }]
        }).list;

        return {data: randomAnnouncements};
    },

    async createPost(postData) {
        console.log('Creating Post (Mock.js):', postData);
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 500));

        const authorInfo = postData.authorId ? getUserBaseById(postData.authorId) : getUserBaseById(1);

        const newPost = {
            ...postData,
            id: mockPostDataStore.length + 1,
            date: new Date().toISOString().split('T')[0],
            views: 0,
            likes: 0,
            shares: 0,
            favorites: 0,
            comments: [],
            authorId: authorInfo.id,
            author: authorInfo.username,
            authorAvatar: authorInfo.avatar,
        };

        mockPostDataStore.push(newPost);
        return {data: newPost};
    },
};