<template>
  <div class="profile-page">
    <el-page-header class="page-header" @back="$router.back()">
    </el-page-header>
    <el-skeleton :rows="10" animated v-if="isLoading"/>
    <el-card v-else-if="userProfile" class="profile-card" shadow="always">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
        </div>
      </template>
      <div class="profile-content">
        <div class="avatar-section">
          <div class="avatar" v-html="userProfile.avatar"></div>
          <h3 class="username">{{ userProfile.username }}</h3>
          <p class="email">{{ userProfile.email }}</p>
        </div>
        <el-divider/>
        <div class="details-section">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">
              {{ userProfile.userId }}
            </el-descriptions-item>
            <el-descriptions-item label="注册日期">
              {{ userProfile.registrationDate }}
            </el-descriptions-item>
            <el-descriptions-item label="所在城市">
              {{ userProfile.address.city }}
            </el-descriptions-item>
            <el-descriptions-item label="街道地址">
              {{ userProfile.address.street }}
            </el-descriptions-item>
            <el-descriptions-item label="个人简介">
              {{ userProfile.bio }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-divider/>
        <el-card class="profile-stats-card">
          <el-row :gutter="20" justify="center">
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#409EFC">
                  <Document/>
                </el-icon>
                <el-statistic
                    title="已读文章"
                    :value="userProfile.stats.articlesRead"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#67C23A">
                  <ChatDotSquare/>
                </el-icon>
                <el-statistic
                    title="已发评论"
                    :value="userProfile.stats.commentsMade"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#F56C6C">
                  <CollectionTag />
                </el-icon>
                <el-statistic
                    title="收藏文章"
                    :value="userProfile.stats.favoritesMade"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item" @click="onShowUserPosts" style="cursor:pointer;">
                <el-icon :size="28" color="#E6A23C">
                  <EditPen/>
                </el-icon>
                <el-statistic
                    title="发布文章"
                    :value="userProfile.stats.articlesPublished"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#909399">
                  <User/>
                </el-icon>
                <el-statistic
                    title="粉丝数"
                    :value="userProfile.stats.followers"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#909399">
                  <UserFilled/>
                </el-icon>
                <el-statistic
                    title="关注数"
                    :value="userProfile.stats.following"
                />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </el-card>

    <el-empty v-else description="无法加载用户信息"></el-empty>

    <el-drawer
        v-model="showPostsDrawer"
        :title="`${userProfile ? userProfile.username : '该用户'} 发布的文章`"
        direction="rtl"
        size="50%"
    >
      <div class="drawer-content">
        <el-empty v-if="!userPosts || userPosts.length === 0" description="该用户暂无发布的文章"></el-empty>
        <el-card v-else v-for="post in userPosts" :key="post.id" class="post-card">
          <template #header>
            <div class="post-card-header">
              <h3>{{ post.title }}</h3>
              <el-tag>{{ post.category || '未分类' }}</el-tag>
            </div>
          </template>
          <p class="post-summary">{{ post.content }}</p>
          <div class="post-meta">
            <span><el-icon><Calendar/></el-icon>{{ formatDate(post.date) }}</span>
            <span><el-icon><View/></el-icon>{{ post.views || 0 }}</span>
            <span><el-icon><Star/></el-icon>{{ post.likes || 0 }}</span>
          </div>
          <el-button type="primary" link @click="goToPostDetail(post.id)">查看详情</el-button>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>
<script setup>
import {ref, watchEffect} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useGlobalStore} from "@/store/global";
import {userService} from "@/services/userService";
import {postService} from "@/services/postService";
import {
  Document,
  ChatDotSquare,
  Star,
  EditPen,
  User,
  UserFilled,
  Calendar,
  View,
  CollectionTag
} from '@element-plus/icons-vue';
import {
  ElCard,
  ElSkeleton,
  ElDivider,
  ElDescriptions,
  ElDescriptionsItem,
  ElRow,
  ElCol,
  ElStatistic,
  ElEmpty,
  ElDrawer,
  ElButton,
  ElTag,
  ElMessage,
  ElPageHeader,
  ElIcon,
} from "element-plus";

const props = defineProps({
  userId: {
    type: String,
    required: false,
  },
});

const route = useRoute();
const router = useRouter();
const store = useGlobalStore();

const userProfile = ref(null);
const isLoading = ref(true);
const showPostsDrawer = ref(false);
const userPosts = ref([]);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date)) return 'N/A';
  return date.toLocaleDateString('zh-CN', {year: 'numeric', month: '2-digit', day: '2-digit'});
};

watchEffect(async () => {
  const targetUserId = props.userId || route.params.userId || store.userId;

  if (!targetUserId) {
    ElMessage.warning("无法加载用户信息，未指定用户");
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  userProfile.value = null;
  userPosts.value = [];

  try {
    const targetUserIdNum = parseInt(targetUserId, 10);

    const [profileResponse, userPostsResponse, allPostsResponse] = await Promise.all([
      userService.getProfile(targetUserIdNum),
      postService.getPost({authorId: targetUserIdNum}),
      postService.getPost()
    ]);

    if (!profileResponse?.data) {
      ElMessage.error("获取用户信息失败：数据为空");
      return;
    }

    const profileData = {
      ...profileResponse.data,
      registrationDate: formatDate(profileResponse.data.registrationDate),
      stats: profileResponse.data.stats || {}
    };

    // 计算发布的文章数
    profileData.stats.articlesPublished = userPostsResponse?.data?.length || 0;
    if (userPostsResponse?.data) {
      userPosts.value = userPostsResponse.data;
    }

    // ===== 核心修改区域 =====
    let commentsMadeCount = 0;
    let totalLikesReceived = 0; // 新增：用于累加获得的点赞总数

    if (allPostsResponse?.data) {
      for (const post of allPostsResponse.data) {
        // 累加该用户收到的点赞数 (遍历所有文章，找到作者是该用户的文章，累加其点赞数)
        if (post.authorId === targetUserIdNum) {
          totalLikesReceived += post.likes || 0;
        }

        // 累加该用户发出的评论数 (遍历所有文章的评论区，找到该用户发表的评论)
        post.comments?.forEach(comment => {
          if (comment.userId === targetUserIdNum) {
            commentsMadeCount++;
          }
        });
      }
    }

    // 将计算出的真实数据绑定到 profileData.stats 对象上
    profileData.stats.commentsMade = commentsMadeCount;
    profileData.stats.likesReceived = totalLikesReceived; // 绑定获得的点赞总数
    profileData.stats.favoritesMade = profileData.favoritePosts?.length || 0;

    // 最终更新UI
    userProfile.value = profileData;

  } catch (error) {
    console.error("获取用户数据失败:", error);
    ElMessage.error("获取用户数据失败，请稍后再试。");
  } finally {
    isLoading.value = false;
  }
});

function onShowUserPosts() {
  if (!userProfile.value) return;
  showPostsDrawer.value = true;
}

const goToPostDetail = (postId) => {
  showPostsDrawer.value = false;
  router.push({name: 'PostDetail', params: {id: postId}});
};
</script>



<style scoped>
.profile-page {
  max-width: 960px;
  margin: 20px auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.profile-card {
  border-radius: 8px;
}

.card-header h2 {
  font-size: 1.8em;
  color: #333;
  text-align: center;
  margin: 0;
}

.profile-content {
  padding: 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 20px;
}

/* 保持原有头像部分的样式，如果 userProfile.avatar 是 SVG/HTML 字符串 */
.avatar-section .avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin: 0 auto 10px;
  overflow: hidden; /* 防止溢出 */
  display: flex; /* 居中内容 */
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5; /* 占位背景色，如果头像内容是透明的 */
}

.username {
  font-size: 1.5em;
  color: #333;
  margin-top: 10px;
}

.email {
  color: #666;
  font-size: 0.9em;
}

.details-section {
  margin-bottom: 20px;
}

.el-descriptions {
  width: 100%;
}

.profile-stats-card {
  margin-top: 20px;
  border-radius: 8px;
}

.statistic-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 0;
  text-align: center;
  transition: background-color 0.3s ease;
}

.statistic-item:hover {
  background-color: #f9f9f9;
  border-radius: 8px;
}

.statistic-item .el-icon {
  margin-bottom: 10px;
}

/* 抽屉内容样式 */
.drawer-content {
  padding: 20px;
}

.post-card {
  margin-bottom: 15px;
  border-radius: 8px;
}

.post-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-card-header h3 {
  margin: 0;
  font-size: 1.1em;
  color: #333;
}

.post-summary {
  font-size: 0.9em;
  color: #666;
  margin: 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85em;
  color: #999;
  margin-top: 10px;
  margin-bottom: 10px;
}

.post-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>