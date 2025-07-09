<template>
  <div class="live-list-container">
  <div class="grid-area">
    <div v-for="(live, index) in liveList" :class="['stream-container', {'is-playing': live.isBeingMonitored}]">
      <div class="play-container" :id="`stream_container_${index}`">
        <img
          class="cover-image"
          :src="live.CoverURL || defaultCoverUrl"
          :alt="`直播间 ${live.RoomId} 封面`"
          @error="handleImageError"
          :class="{ 
            hidden: live.isBeingMonitored && (live.isStreaming || live.shouldShowPlaceholder) 
          }"
        />
        <NoStreamPlaceholder
          :key="`placeholder-${live.RoomId}`"
          :room-id="live.RoomId"
          :class="{ 'placeholder-hidden': !live.shouldShowPlaceholder }"
        />
      </div>
      <div class="operate-btn">
        <div class="btn warning">警告</div>
        <div class="btn destroy" @click="() => handleDestroyRoom(live.RoomId)">强制解散</div>
      </div>
      <el-tooltip
        class="tool-tip"
        effect="dark"
        :content="live.RoomId"
        placement="top-start"
      >
        <div
          class="room-id"
          :style="{ backgroundColor: live.isBeingMonitored ? '#67c995' : '#ea8b4e' }"
          :class="{ hidden: live.shouldShowPlaceholder }"
        >
          <span>{{ live.RoomId }}</span>
        </div>
      </el-tooltip>
      <div class="room-status" :class="{ hidden: live.shouldShowPlaceholder }">
        {{ index }}
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ElTooltip, ElMessageBox, ElMessage } from "element-plus";
import NoStreamPlaceholder from "./NoStreamPlaceholder.vue";
import { useLiveState } from "../states/LiveState.ts";
import { defaultCoverUrl } from "../config";

const {
  liveList,
  fetchLiveList,
  destroyLiveRoom,
} = useLiveState();

const handleDestroyRoom = async (roomId: string) => {
  if (!roomId) return;

  try {
    // 显示确认弹窗
    await ElMessageBox.confirm(
      `确定要强制解散房间 ${roomId} 吗？此操作不可撤销。`,
      "确认解散",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    // 用户确认后执行解散操作
    await destroyLiveRoom(roomId);
    ElMessage.success(`房间 ${roomId} 解散成功`);
  } catch (error) {
    // 用户取消或操作失败，不显示错误信息（取消是正常行为）
    if (error !== "cancel") {
      ElMessage.error(`房间 ${roomId} 解散失败`);
    }
  }
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  const index = parseInt(
    img.closest(".stream-container")?.querySelector(".room-status")
      ?.textContent || "0",
  );
  img.src = getDefaultCover(index);
};

const getDefaultCover = (index: number) => {
  return `https://picsum.photos/200/300?random=${index}`;
};

onMounted(() => {
  fetchLiveList();
});
</script>

<style scoped lang="scss">
.live-list-container {
  height: 100%;
  overflow: hidden;
}

.grid-area {
  --operate-btn-height: 48px;
  --card-border-radius: 16px;
  
  // 现代化配色方案
  --primary-bg: #ffffff;
  --primary-border: #e1e8ed;
  --primary-border-hover: #c9d6df;
  --primary-text: #1a202c;
  --primary-text-light: #4a5568;
  --primary-text-muted: #718096;
  
  // 强调色 - 柔和内敛的配色
  --accent-blue: #4299e1;
  --accent-green: #48bb78;
  --accent-orange: #ed8936;
  --accent-red: #f56565;
  --accent-purple: #9f7aea;
  --accent-teal: #4fd1c7;
  
  // 背景色
  --bg-canvas: #f7fafc;
  --bg-subtle: #edf2f7;
  --bg-muted: #e2e8f0;
  
  // 阴影
  --shadow-small: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-large: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
  
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
  gap: 24px;
  background: var(--bg-canvas);
  box-sizing: border-box;

  .stream-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    width: 200px;
    height: 320px;
    background: var(--primary-bg);
    margin: 0;
    border: 1px solid var(--primary-border);
    border-radius: var(--card-border-radius);
    box-shadow: var(--shadow-medium);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: var(--primary-border-hover);
      box-shadow: var(--shadow-xl);
      transform: translateY(-4px);
      cursor: pointer;

      .room-id {
        opacity: 1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .room-status {
        opacity: 1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .play-container {
      position: relative;
      width: 100%;
      max-height: calc(100% - var(--operate-btn-height));
      flex-grow: 1;
      overflow: hidden;
      background: var(--bg-subtle);

      .cover-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: var(--card-border-radius) var(--card-border-radius) 0 0;
        background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
        transition: opacity 0.3s ease;
        z-index: 1;
        -webkit-user-drag: none;
      }

      .cover-image.hidden {
        opacity: 0;
        pointer-events: none;
        z-index: 0;
      }

      video {
        position: relative;
        z-index: 10;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: var(--card-border-radius) var(--card-border-radius) 0 0;
      }

      :deep(.placeholder-hidden) {
        display: none !important;
      }
    }

    .operate-btn {
      display: flex;
      flex-shrink: 0;
      width: 100%;
      height: var(--operate-btn-height);
      overflow: hidden;
      position: relative;
      background: var(--bg-subtle);
      border-top: 1px solid var(--primary-border);

      .btn {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 50%;
        color: var(--primary-text-light);
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        border: none;
        background: transparent;

        &:active {
          transform: translateY(1px);
        }

        &:first-child {
          border-right: 1px solid var(--primary-border);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .warning {
        color: var(--accent-orange);
        
        &:hover:not(:disabled) {
          background: var(--accent-orange);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(237, 137, 54, 0.3);
        }
      }

      .destroy {
        color: var(--accent-red);

        &:hover:not(:disabled) {
          background: var(--accent-red);
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }
      }
    }

    .room-id {
      position: absolute;
      right: 10px;
      top: 10px;
      max-width: 55%;
      height: 24px;
      padding: 0 8px;
      line-height: 24px;
      overflow: hidden;
      border-radius: 12px;
      cursor: pointer;
      z-index: 15;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
      color: white;
      font-weight: 600;
      font-size: 11px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.85;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        opacity: 1;
        background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
      }

      &.hidden {
        opacity: 0;
        pointer-events: none;
      }

      span {
        display: inline-block;
        text-wrap: nowrap;
        text-align: center;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }

    .room-status {
      position: absolute;
      left: 10px;
      top: 10px;
      width: 28px;
      height: 24px;
      padding: 0;
      line-height: 24px;
      overflow: hidden;
      border-radius: 12px;
      cursor: pointer;
      z-index: 15;
      background: linear-gradient(135deg, var(--accent-teal), var(--accent-green));
      color: white;
      font-weight: 700;
      font-size: 11px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.85;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        opacity: 1;
        background: linear-gradient(135deg, var(--accent-green), var(--accent-teal));
      }

      &.hidden {
        opacity: 0;
        pointer-events: none;
      }
    }
  }

  .is-playing {
    border: 5px solid var(--accent-green);
  }

  .is-enter-room {
    background: var(--primary-bg) !important;
    border-color: var(--accent-green) !important;
    box-shadow: 
      0 0 0 2px rgba(56, 161, 105, 0.2),
      var(--shadow-large) !important;

    &:hover {
      box-shadow: 
        0 0 0 2px rgba(56, 161, 105, 0.3),
        var(--shadow-xl) !important;
    }

    .operate-btn {
      background: linear-gradient(135deg, rgba(56, 161, 105, 0.05), rgba(49, 151, 149, 0.05)) !important;
      border-top-color: var(--accent-green) !important;

      .warning {
        color: var(--accent-green);
        font-weight: 700;
        
        &::after {
          content: 'Monitoring';
        }

        &:hover {
          background: var(--accent-green) !important;
          color: white;
          box-shadow: 0 4px 12px rgba(56, 161, 105, 0.4) !important;
        }
      }

      .destroy {
        color: var(--accent-green);
        font-weight: 700;
        
        &::after {
          content: 'Stop';
        }

        &:hover {
          background: var(--accent-green) !important;
          color: white;
          box-shadow: 0 4px 12px rgba(56, 161, 105, 0.4) !important;
        }
      }
    }

    .room-status {
      background: linear-gradient(135deg, var(--accent-green), var(--accent-teal)) !important;
      opacity: 1;
      box-shadow: 0 2px 8px rgba(56, 161, 105, 0.3);
    }

    .room-id {
      background: linear-gradient(135deg, var(--accent-green), var(--accent-teal)) !important;
      opacity: 1;
      box-shadow: 0 2px 8px rgba(56, 161, 105, 0.3);
    }
  }
}

// 响应式设计
@media (max-width: 1600px) {
  .grid-area {
    grid-template-columns: repeat(6, 1fr);
    gap: 20px;
    padding: 20px;
  }
}

@media (max-width: 1400px) {
  .grid-area {
    grid-template-columns: repeat(5, 1fr);
    gap: 18px;
    padding: 18px;
  }
}

@media (max-width: 1200px) {
  .grid-area {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 16px;

    .stream-container {
      width: 180px;
      height: 300px;
    }
  }
}

@media (max-width: 1000px) {
  .grid-area {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    padding: 14px;

    .stream-container {
      width: 170px;
      height: 280px;
    }
  }
}

@media (max-width: 800px) {
  .grid-area {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;

    .stream-container {
      width: 160px;
      height: 260px;

      .operate-btn .btn {
        font-size: 11px;
      }

      .room-id, .room-status {
        font-size: 10px;
        height: 22px;
        line-height: 22px;
      }
    }
  }
}

@media (max-width: 600px) {
  .grid-area {
    grid-template-columns: repeat(1, 1fr);
    gap: 10px;
    padding: 10px;

    .stream-container {
      width: 100%;
      max-width: 280px;
      height: 240px;
      margin: 0 auto;
      
      .operate-btn .btn {
        font-size: 10px;
      }

      .room-id, .room-status {
        font-size: 9px;
        height: 20px;
        line-height: 20px;
      }
    }
  }
}

// 现代化滚动条
.grid-area::-webkit-scrollbar {
  width: 8px;
}

.grid-area::-webkit-scrollbar-track {
  background: var(--bg-subtle);
  border-radius: 4px;
}

.grid-area::-webkit-scrollbar-thumb {
  background: var(--primary-text-muted);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.grid-area::-webkit-scrollbar-thumb:hover {
  background: var(--primary-text-light);
}
</style>

