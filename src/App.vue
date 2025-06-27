<template>
  <div id="app">
    <!-- 新的Header组件 -->
    <AppHeader />

    <!-- 主要内容区域 -->
    <div class="main-content">
      <LiveList />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import LiveList from "./components/LiveList.vue";
import AppHeader from "./components/AppHeader.vue";
import { useLiveState } from './states/LiveState';

const { cleanup } = useLiveState();

// 应用退出时清理资源
onUnmounted(() => {
  cleanup();
});
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
  color: #24292f;
  background: #f6f8fa;
}

.main-content {
  flex: 1;
  overflow: hidden;
  min-height: 0; /* 这个很重要，确保flex子元素可以缩小 */
}

body {
  margin: 0;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Element Plus 组件样式覆盖 */
.el-message {
  border-radius: 6px !important;
  border: 1px solid #d1d9e0 !important;
  box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2) !important;
}

.el-message.el-message--success {
  background-color: #f6ffed !important;
  border-color: #52c41a !important;
  color: #135200 !important;
}

.el-message.el-message--error {
  background-color: #fff2f0 !important;
  border-color: #ff4d4f !important;
  color: #cf1322 !important;
}

.el-message-box {
  border-radius: 8px !important;
  border: 1px solid #d1d9e0 !important;
  box-shadow: 0 16px 32px rgba(27, 31, 36, 0.24) !important;
}

.el-button--primary {
  background-color: #0969da !important;
  border-color: #0969da !important;
}

.el-button--primary:hover {
  background-color: #0860ca !important;
  border-color: #0860ca !important;
}
</style>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f6f8fa;

  .body {
    overflow: hidden;
    flex: 1;
    background: #f6f8fa;
  }
}
</style>
