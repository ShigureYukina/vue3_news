<template>
  <div class="profile-page">
    <el-skeleton :rows="8" animated v-if="loading"/>
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
                <el-icon :size="28" color="#E6A23C">
                  <Star/>
                </el-icon>
                <el-statistic
                    title="获得点赞"
                    :value="userProfile.stats.likesReceived"
                />
              </div>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <div class="statistic-item">
                <el-icon :size="28" color="#F56C6C">
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
  </div>
</template>

<script setup>
import {ref, watchEffect} from "vue";
import {useGlobalStore} from "@/store/global";
import {userService} from "@/services/userService";
import {
  Document,
  ChatDotSquare,
  Star,
  EditPen, // 'edit' 对应 'EditPen'
  User,
  UserFilled
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
} from "element-plus";

const props = defineProps({
  userId: {
    type: String,
    required: false, // 因为路由参数是可选的
  },
});
const store = useGlobalStore();
const userProfile = ref(null);
const loading = ref(true);


watchEffect(async () => {
  // 优先使用路由传来的 props.userId, 如果没有（例如访问 /profile），则回退到store中的当前用户ID
  const targetUserId = props.userId || store.userId;

  if (!targetUserId) {
    console.warn("无法确定目标用户ID");
    store.showMessage("无法加载用户信息，未指定用户", "warning");
    loading.value = false;
    return;
  }

  loading.value = true;
  userProfile.value = null; // 在加载新数据前清空旧数据

  try {
    const response = await userService.getProfile(targetUserId);
    userProfile.value = response.data;
  } catch (error) {
    store.showMessage("获取用户信息失败", "error");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.profile-card {
  margin: 20px auto;
}

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--el-text-color-primary);
}

.profile-content {
  text-align: center;
}

.avatar-section .avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 1rem;
  overflow: hidden;
  border: 3px solid var(--el-color-primary);
  background-color: #f0f2f5;
}

.avatar-section .avatar > :deep(svg) {
  width: 100%;
  height: 100%;
}

.username {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
}

.email {
  color: var(--el-text-color-secondary);
  margin-top: 0.25rem;
}

.details-section {
  text-align: left;
  margin-top: 1.5rem;
}

.stats-section {
  margin-top: 1.5rem;
  text-align: left;
}

.stats-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--el-text-color-primary);
}

.profile-stats-card {
  margin: 20px 0;
  background-color: var(--el-bg-color-overlay);
  border: none;
  box-shadow: var(--el-box-shadow-light);
}

.statistic-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  border-radius: var(--el-border-radius-base);
  transition: background-color 0.3s ease;
}

.statistic-item:hover {
  background-color: var(--el-color-primary-light-9);
}

.el-statistic__title {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.el-statistic__value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.el-icon {
  margin-bottom: 8px;
  font-size: 24px;
  color: var(--el-color-primary);
}
</style>