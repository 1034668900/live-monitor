<template>
  <header class="app-header">
    <!-- 品牌和标题区域 -->
    <div class="brand-section">
      <div class="brand-logo">
        <div class="logo-icon">📺</div>
        <div class="logo-gradient"></div>
      </div>
      <div class="brand-content">
        <h1 class="brand-title">Live Monitor</h1>
        <p class="brand-subtitle">实时直播间监控系统</p>
      </div>
      <div class="brand-indicator"></div>
    </div>

    <!-- 状态信息区域 -->
    <div class="status-section">
      <div class="status-grid">
        <div class="status-card primary">
          <div class="status-icon">🏠</div>
          <div class="status-content">
            <span class="status-label">直播间数</span>
            <span class="status-value">{{ liveList.length }}</span>
          </div>
        </div>
        
        <div class="status-card active">
          <div class="status-icon">👁️</div>
          <div class="status-content">
            <span class="status-label">监控中</span>
            <span class="status-value">{{ currentMonitorRooms.length }}</span>
          </div>
        </div>
        
        <div class="status-card concurrent">
          <div class="status-icon">🔢</div>
          <div class="status-content">
            <span class="status-label">同时监控</span>
            <span class="status-value">{{ concurrentMonitors || 4 }}</span>
          </div>
        </div>
        


      </div>
    </div>

    <!-- 核心操作区域 -->
    <div class="actions-section">
      <div class="action-group primary-actions">
        <button 
          class="action-btn start-btn"
          @click="handleStartMonitor"
          :disabled="isLoading"
          :class="{ loading: isLoading }"
        >
          <div class="btn-content">
            <span class="btn-icon">▶️</span>
            <span class="btn-text">开始监控</span>
          </div>
          <div class="btn-ripple"></div>
        </button>
        
        <button 
          class="action-btn stop-btn"
          @click="handleStopMonitor"
          :disabled="isLoading || currentMonitorRooms.length === 0"
        >
          <div class="btn-content">
            <span class="btn-icon">⏹️</span>
            <span class="btn-text">停止监控</span>
          </div>
          <div class="btn-ripple"></div>
        </button>
      </div>

      <div class="action-group secondary-actions">
        <button 
          class="action-btn nav-btn switch-btn"
          @click="startMonitorLastGroup"
          :disabled="isLoading"
          title="上一组监控"
        >
          <div class="btn-content">
            <span class="btn-icon">⬅️</span>
            <span class="btn-text">上一组</span>
          </div>
        </button>
        
        <button 
          class="action-btn nav-btn switch-btn"
          @click="startMonitorNextGroup"
          :disabled="isLoading"
                      title="下一组监控"
        >
          <div class="btn-content">
            <span class="btn-icon">➡️</span>
            <span class="btn-text">下一组</span>
          </div>
        </button>
        
        <button 
          class="action-btn load-btn"
          @click="handleFetchMoreRooms"
          :disabled="isLoading"
          :class="{ loading: isLoading }"
          title="加载更多房间"
        >
          <div class="btn-content">
            <span class="btn-icon">📥</span>
            <span class="btn-text">{{ isLoading ? '加载中...' : '加载直播间' }}</span>
          </div>
        </button>
      </div>


    </div>

    <!-- 加载状态指示器 -->
    <div class="loading-indicator" :class="{ active: isLoading }">
      <div class="loading-bar"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useLiveState } from '../states/LiveState';

const {
  isLoading,
  liveList,
  currentMonitorRooms,
  startMonitor,
  stopMonitor,
  startMonitorNextGroup,
  startMonitorLastGroup,
  fetchLiveList,
  concurrentMonitors,
  initializePlayers
} = useLiveState();

// 组件挂载时初始化播放器
onMounted(async () => {
  try {
    console.log('[AppHeader] Initializing players on mount...');
    await initializePlayers();
    console.log('[AppHeader] Players initialized successfully');
  } catch (error) {
    console.error('[AppHeader] Failed to initialize players:', error);
  }
});

// 开始监控处理
const handleStartMonitor = async () => {
  try {
    await startMonitor();
  } catch (error) {
    console.error('Start monitor failed:', error);
  }
};

// 停止监控处理
const handleStopMonitor = async () => {
  try {
    await stopMonitor();
  } catch (error) {
    console.error('Stop monitor failed:', error);
  }
};

// 获取更多房间
const handleFetchMoreRooms = async () => {
  try {
    await fetchLiveList();
  } catch (error) {
    console.error('Fetch more rooms failed:', error);
  }
};
</script>

<style scoped lang="scss">
.app-header {
  // 现代化设计变量
  --header-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --header-border: rgba(255, 255, 255, 0.1);
  --header-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --text-muted: rgba(255, 255, 255, 0.6);
  
  // 状态卡片颜色
  --status-primary: rgba(79, 172, 254, 0.2);
  --status-active: rgba(16, 185, 129, 0.2);
  --status-concurrent: rgba(139, 92, 246, 0.2);
  
  // 按钮颜色
  --btn-start: linear-gradient(135deg, #10b981 0%, #059669 100%);
  --btn-stop: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  --btn-secondary: rgba(255, 255, 255, 0.1);
  --btn-hover: rgba(255, 255, 255, 0.2);
  
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 80px;
  padding: 16px 24px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  box-shadow: var(--header-shadow);
  backdrop-filter: blur(20px);
  overflow: visible;

  // 背景装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }

  .brand-section {
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1;

    .brand-logo {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);

      .logo-icon {
        font-size: 24px;
        z-index: 2;
      }

      .logo-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        border-radius: 12px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover .logo-gradient {
        opacity: 1;
      }
    }

    .brand-content {
      .brand-title {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.2;
        background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .brand-subtitle {
        margin: 2px 0 0 0;
        font-size: 13px;
        color: var(--text-secondary);
        font-weight: 400;
        letter-spacing: 0.5px;
      }
    }

    .brand-indicator {
      width: 3px;
      height: 40px;
      background: linear-gradient(to bottom, #ffffff, rgba(255, 255, 255, 0.4));
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }
  }

  .status-section {
    flex: 1;
    max-width: 600px;
    margin: 0 32px;
    z-index: 1;

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr); // 调整为3列以适应3个状态卡片
      gap: 12px;

      .status-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .status-icon {
          font-size: 18px;
          opacity: 0.9;
        }

        .status-content {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .status-label {
            font-size: 11px;
            color: var(--text-muted);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .status-value {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1;
          }
        }

        &.primary {
          background: var(--status-primary);
          .status-icon { filter: hue-rotate(200deg); }
        }

                &.active {
          background: var(--status-active);
          .status-icon { filter: hue-rotate(120deg); }
        }

        &.concurrent {
          background: var(--status-concurrent);
          .status-icon { filter: hue-rotate(260deg); }
        }

        


      }
    }
  }

  .actions-section {
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1;

    .action-group {
      display: flex;
      gap: 8px;

      &.primary-actions {
        .action-btn {
          min-width: 130px;
          height: 48px; // 统一高度为48px
          padding: 0 18px;

          .btn-content {
            display: flex;
            align-items: center;
            gap: 8px;

            .btn-text {
              font-size: 14px;
              font-weight: 600;
            }

            .btn-icon {
              font-size: 16px;
            }
          }
        }

        .start-btn {
          background: var(--btn-start);
          
          &:hover:not(:disabled) {
            box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
            transform: translateY(-2px);
          }

          &.loading {
            .btn-icon {
              animation: spin 1s linear infinite;
            }
          }
        }

        .stop-btn {
          background: var(--btn-stop);
          
          &:hover:not(:disabled) {
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
            transform: translateY(-2px);
          }
        }
      }

      &.secondary-actions {
        // 为包含切换按钮的组添加特殊样式
        padding: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(79, 172, 254, 0.3);
        border-radius: 14px;
        gap: 12px;
        backdrop-filter: blur(20px);
        align-items: center; // 确保所有按钮垂直居中

        .action-btn {
          width: 40px;
          height: 48px; // 统一高度为48px以匹配切换按钮
          border-radius: 10px;

          &.nav-btn {
            .btn-icon {
              font-size: 16px;
            }

            // 切换按钮特殊样式 - 与主按钮协调
            &.switch-btn {
              width: auto;
              min-width: 140px; // 稍微调整宽度
              height: 48px;
              padding: 0 18px; // 与主按钮一致的内边距
              background: linear-gradient(135deg, rgba(79, 172, 254, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
              border: 2px solid rgba(79, 172, 254, 0.5);
              
              .btn-content {
                display: flex;
                align-items: center;
                gap: 8px;
                
                .btn-icon {
                  font-size: 16px; // 与主按钮图标大小一致
                }
                
                .btn-text {
                  font-size: 14px;
                  font-weight: 600;
                  white-space: nowrap;
                }
              }

              &:hover:not(:disabled) {
                background: linear-gradient(135deg, rgba(79, 172, 254, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%);
                border-color: rgba(79, 172, 254, 0.7);
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(79, 172, 254, 0.3);
              }

              &:active:not(:disabled) {
                transform: translateY(0px);
              }
            }
          }

          &.load-btn {
            width: auto;
            min-width: 100px;
            padding: 0 18px; // 与主按钮一致的内边距

            .btn-content {
              display: flex;
              align-items: center;
              gap: 8px; // 与主按钮一致的间距

              .btn-icon {
                font-size: 16px; // 与主按钮图标大小一致
                transition: transform 0.3s ease;
              }

              .btn-text {
                font-size: 14px; // 与主按钮文字大小一致
                font-weight: 600;
              }
            }

            // 加载按钮的loading效果
            &.loading {
              .btn-icon {
                animation: spin 1s linear infinite;
              }

              .btn-text {
                opacity: 0.9;
                position: relative;
                
                // 加载中文字的跳动效果
                &::after {
                  content: '';
                  position: absolute;
                  right: -4px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 3px;
                  height: 3px;
                  background: currentColor;
                  border-radius: 50%;
                  animation: loading-dots 1.4s ease-in-out infinite both;
                  opacity: 0.6;
                }
              }

              // 加载时的脉冲效果
              &::before {
                content: '';
                position: absolute;
                inset: -2px;
                background: linear-gradient(135deg, rgba(79, 172, 254, 0.3), rgba(139, 92, 246, 0.3));
                border-radius: inherit;
                animation: pulse-ring 2s ease-in-out infinite;
                z-index: -1;
              }
            }
          }
        }
      }
    }

    .action-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--btn-secondary);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      overflow: hidden;

      &:hover:not(:disabled) {
        background: var(--btn-hover);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      }

      &:active:not(:disabled) {
        transform: translateY(1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
        box-shadow: none !important;
      }

      .btn-ripple {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover .btn-ripple {
        opacity: 1;
      }

      .btn-icon {
        font-size: 14px;
      }
    }


  }

  .loading-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;

    .loading-bar {
      height: 100%;
      background: linear-gradient(90deg, transparent, #ffffff, transparent);
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }

    &.active .loading-bar {
      animation: loading-slide 2s ease-in-out infinite;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes loading-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse-ring {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes loading-dots {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: translateY(-50%) scale(0.8);
  }
  40% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .app-header {
    .status-section {
      .status-grid {
        grid-template-columns: repeat(3, 1fr); // 保持3列布局
        gap: 8px;
      }
    }
  }
}

@media (max-width: 1200px) {
  .app-header {
    padding: 12px 20px;

    .brand-section {
      gap: 12px;

      .brand-logo {
        width: 40px;
        height: 40px;

        .logo-icon {
          font-size: 20px;
        }
      }

      .brand-content {
        .brand-title {
          font-size: 20px;
        }

        .brand-subtitle {
          font-size: 12px;
        }
      }
    }

    .status-section {
      margin: 0 24px;

      .status-grid {
        .status-card {
          padding: 10px 12px;

          .status-icon {
            font-size: 16px;
          }

          .status-content {
            .status-value {
              font-size: 14px;
            }
          }
        }
      }
    }

    .actions-section {
      gap: 12px;

      .action-group.primary-actions .action-btn {
        min-width: 110px;
        height: 42px; // 统一中等屏幕下的按钮高度
        padding: 0 16px;

        .btn-content {
          .btn-text {
            font-size: 13px;
          }

          .btn-icon {
            font-size: 15px;
          }
        }
      }

      .action-group.secondary-actions {
        .action-btn {
          height: 42px; // 统一中等屏幕下的按钮高度
        }

        .action-btn.nav-btn.switch-btn {
          min-width: 120px;
          padding: 0 16px;

          .btn-content {
            gap: 6px;

            .btn-icon {
              font-size: 15px;
            }

            .btn-text {
              font-size: 13px;
            }
          }
        }

        .action-btn.load-btn {
          min-width: 85px;
          padding: 0 16px;

          .btn-content {
            .btn-icon {
              font-size: 15px;
            }

            .btn-text {
              font-size: 13px;
              position: relative;
            }
          }

          &.loading {
            .btn-icon {
              animation: spin 1s linear infinite;
            }

            .btn-text::after {
              content: '';
              position: absolute;
              right: -3px;
              top: 50%;
              transform: translateY(-50%);
              width: 2px;
              height: 2px;
              background: currentColor;
              border-radius: 50%;
              animation: loading-dots 1.4s ease-in-out infinite both;
              opacity: 0.6;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 1000px) {
  .app-header {
    flex-direction: column;
    gap: 16px;
    min-height: auto;
    padding: 16px 20px;

    .brand-section {
      width: 100%;
      justify-content: center;
    }

    .status-section {
      width: 100%;
      margin: 0;

      .status-grid {
        grid-template-columns: repeat(3, 1fr); // 调整为3列布局
        gap: 8px;
      }
    }

    .actions-section {
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 12px 16px;

    .status-section {
      .status-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;

        .status-card {
          padding: 8px 10px;

          .status-icon {
            font-size: 14px;
          }

          .status-content {
            .status-label {
              font-size: 10px;
            }

            .status-value {
              font-size: 12px;
            }
          }
        }
      }
    }

    .actions-section {
      .action-group.primary-actions .action-btn {
        min-width: 90px;
        height: 38px; // 统一小屏幕下的按钮高度
        padding: 0 14px;

        .btn-content {
          .btn-text {
            font-size: 12px;
          }

          .btn-icon {
            font-size: 14px;
          }
        }
      }

      .action-group.secondary-actions .action-btn {
        width: 36px;
        height: 38px; // 统一小屏幕下的按钮高度

        &.nav-btn.switch-btn {
          width: auto;
          min-width: 100px;
          padding: 0 14px;

          .btn-content {
            gap: 6px;

            .btn-icon {
              font-size: 14px;
            }

            .btn-text {
              font-size: 12px;
            }
          }
        }

        &.load-btn {
          width: auto;
          min-width: 75px;
          padding: 0 14px;

          .btn-content {
            .btn-icon {
              font-size: 14px;
            }

            .btn-text {
              font-size: 12px;
              position: relative;
            }
          }

          &.loading {
            .btn-icon {
              animation: spin 1s linear infinite;
            }

            .btn-text::after {
              content: '';
              position: absolute;
              right: -2px;
              top: 50%;
              transform: translateY(-50%);
              width: 2px;
              height: 2px;
              background: currentColor;
              border-radius: 50%;
              animation: loading-dots 1.4s ease-in-out infinite both;
              opacity: 0.6;
            }
          }
        }
      }
    }
  }
}
</style> 