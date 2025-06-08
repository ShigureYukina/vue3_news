<template>
  <div class="dashboard-page" v-if="!loading">
    <el-row :gutter="20" class="kpi-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-card">
            <div
              class="kpi-icon"
              style="background-color: #e6f7ff; color: #1890ff"
            >
              <el-icon><Document /></el-icon>
            </div>
            <div class="kpi-text">
              <div class="kpi-label">新闻总数</div>
              <div class="kpi-value">{{ kpi.totalNews }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-card">
            <div
              class="kpi-icon"
              style="background-color: #fffbe6; color: #faad14"
            >
              <el-icon><Collection /></el-icon>
            </div>
            <div class="kpi-text">
              <div class="kpi-label">总分类数</div>
              <div class="kpi-value">{{ kpi.totalCategories }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-card">
            <div
              class="kpi-icon"
              style="background-color: #f6ffed; color: #52c41a"
            >
              <el-icon><View /></el-icon>
            </div>
            <div class="kpi-text">
              <div class="kpi-label">总浏览量</div>
              <div class="kpi-value">{{ kpi.totalViews }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="kpi-card">
            <div
              class="kpi-icon"
              style="background-color: #fff1f0; color: #f5222d"
            >
              <el-icon><ChatLineSquare /></el-icon>
            </div>
            <div class="kpi-text">
              <div class="kpi-label">总评论数</div>
              <div class="kpi-value">{{ kpi.totalComments }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <ChartCard title="新闻分类占比" :option="categoryPieOption" />
      </el-col>
      <el-col :span="12">
        <ChartCard title="各分类平均浏览量" :option="viewsBarOption" />
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <ChartCard
          title="新闻发布趋势 (近30天)"
          :option="publicationLineOption"
        />
      </el-col>
    </el-row>
  </div>
  <el-skeleton v-else :rows="10" animated />
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { newsService } from "@/services/newsService";
import ChartCard from "@/components/ChartCard.vue";
import {
  Document,
  Collection,
  View,
  ChatLineSquare,
} from "@element-plus/icons-vue";

const allNews = ref([]);
const loading = ref(true);

const kpi = computed(() => {
  const totalViews = allNews.value.reduce((sum, news) => sum + news.views, 0);
  const totalComments = allNews.value.reduce(
    (sum, news) => sum + (news.comments?.length || 0),
    0
  );
  const uniqueCategories = [
    ...new Set(allNews.value.map((news) => news.category)),
  ];
  return {
    totalNews: allNews.value.length,
    totalCategories: uniqueCategories.length,
    totalViews: totalViews.toLocaleString(),
    totalComments: totalComments.toLocaleString(),
  };
});

const categoryData = computed(() => {
  const categoryCount = allNews.value.reduce((acc, news) => {
    acc[news.category] = (acc[news.category] || 0) + 1;
    return acc;
  }, {});
  return Object.keys(categoryCount).map((key) => ({
    name: key,
    value: categoryCount[key],
  }));
});

const categoryViewsData = computed(() => {
  const categoryStats = allNews.value.reduce((acc, news) => {
    if (!acc[news.category]) {
      acc[news.category] = { totalViews: 0, count: 0 };
    }
    acc[news.category].totalViews += news.views;
    acc[news.category].count += 1;
    return acc;
  }, {});

  return Object.keys(categoryStats)
    .map((key) => ({
      name: key,
      avgViews: Math.round(
        categoryStats[key].totalViews / categoryStats[key].count
      ),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
});

const publicationTrendData = computed(() => {
  const last30Days = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30Days[d.toISOString().split("T")[0]] = 0;
  }
  allNews.value.forEach((news) => {
    const date = news.date;
    if (last30Days[date] !== undefined) {
      last30Days[date]++;
    }
  });
  return {
    dates: Object.keys(last30Days),
    counts: Object.values(last30Days),
  };
});

const categoryPieOption = computed(() => ({
  tooltip: { trigger: "item" },
  legend: { top: "5%", left: "center" },
  series: [
    {
      name: "新闻分类",
      type: "pie",
      radius: ["40%", "70%"],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: "#fff",
        borderWidth: 2,
      },
      label: { show: false, position: "center" },
      emphasis: {
        label: { show: true, fontSize: "20", fontWeight: "bold" },
      },
      labelLine: { show: false },
      data: categoryData.value,
    },
  ],
}));

const viewsBarOption = computed(() => ({
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  xAxis: {
    type: "category",
    data: categoryViewsData.value.map((item) => item.name),
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "平均浏览量",
      data: categoryViewsData.value.map((item) => item.avgViews),
      type: "bar",
      showBackground: true,
      backgroundStyle: {
        color: "rgba(180, 180, 180, 0.2)",
      },
    },
  ],
}));

const publicationLineOption = computed(() => ({
  tooltip: { trigger: "axis" },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: publicationTrendData.value.dates.map((d) => d.substring(5)), // Show MM-DD
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "发布数量",
      data: publicationTrendData.value.counts,
      type: "line",
      areaStyle: {},
    },
  ],
}));

onMounted(async () => {
  try {
    const response = await newsService.getNews();
    allNews.value = response.data;
  } catch (error) {
    console.error("无法加载新闻数据:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}
.kpi-row {
  margin-bottom: 20px;
}
.kpi-card {
  display: flex;
  align-items: center;
}
.kpi-icon {
  font-size: 2rem;
  padding: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}
.kpi-text .kpi-label {
  font-size: 0.9rem;
  color: var(--el-text-color-secondary);
}
.kpi-text .kpi-value {
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
