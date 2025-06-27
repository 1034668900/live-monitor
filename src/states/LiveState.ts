import { ref, watch } from 'vue';
import { type LiveRoomInfo } from '../types/room';
import { concurrentMonitors } from '../config';
import { getLiveList, destroyRoom } from '../api';
import {
  usePlayerManager,
  PlayerEvent,
  type PlayerEventData,
} from '../manager';

// 使用新的播放器管理器
const playerManager = usePlayerManager();

const liveList = ref<LiveRoomInfo[]>([]);
const isLoading = ref(false);
const currentMonitorRooms = ref<string[]>([]);
const playerIds = ref<string[]>([]);

const LOG_TAG = '[LiveMonitor]';

let cursor = '0';
let monitorStartIndex = ref(0);

// 初始化播放器
const initializePlayers = async () => {
  try {
    console.log(`${LOG_TAG} Starting player initialization...`);
    const { createBasicAccount } = await import('../config');

    // 根据当前流类型创建对应的播放器
    await createPlayers();

    console.log(`${LOG_TAG} Player creation completed:`, {
      requested: concurrentMonitors,
      created: playerIds.value.length,
      playerIds: playerIds.value,
      success: playerIds.value.length > 0,
    });

    if (playerIds.value.length === 0) {
      console.error(`${LOG_TAG} Attempting to diagnose the issue...`);

      // 诊断信息
      try {
        const diagAccount = createBasicAccount();
        console.error(`${LOG_TAG} Diagnosis - Account creation:`, {
          success: !!diagAccount,
          details: diagAccount,
        });
      } catch (diagError) {
        console.error(
          `${LOG_TAG} Diagnosis - Account creation failed:`,
          diagError
        );
      }
    } else {
      console.log(
        `${LOG_TAG} Successfully created ${playerIds.value.length} players`
      );
    }

    // 设置播放器事件监听
    setupPlayerEventListeners();
  } catch (error) {
    console.error(`${LOG_TAG} Player initialization failed:`, error);
    throw error;
  }
};

// 创建播放器（只支持TRTC）
const createPlayers = async () => {
  // 只使用 TRTC 播放器
  const ids = await playerManager.createTRTCPlayers(concurrentMonitors);
  playerIds.value = ids;
  console.log(`${LOG_TAG} Created ${ids.length} TRTC instances`);
};

// 设置播放器事件监听
const setupPlayerEventListeners = () => {
  playerIds.value.forEach((playerId) => {
    const player = playerManager.getPlayer(playerId);
    if (!player) return;

    // 监听播放事件，隐藏占位符
    player.on(PlayerEvent.PLAYING, (data: PlayerEventData) => {
      if (data.roomId) {
        hideRoomPlaceholder(data.roomId);
      }
    });

    // 监听停止事件，显示占位符
    player.on(PlayerEvent.STOPPED, (data: PlayerEventData) => {
      if (data.roomId) {
        showRoomPlaceholder(data.roomId);
      }
    });

    // 监听错误事件，显示占位符
    player.on(PlayerEvent.ERROR, (data: PlayerEventData) => {
      if (data.roomId) {
        showRoomPlaceholder(data.roomId);
      }
    });

    // 监听连接事件
    player.on(PlayerEvent.CONNECTED, (data: PlayerEventData) => {
      console.log(`${LOG_TAG} Player connected to room: ${data.roomId}`);
    });

    // 监听断开事件
    player.on(PlayerEvent.DISCONNECTED, (data: PlayerEventData) => {
      console.log(`${LOG_TAG} Player disconnected from room: ${data.roomId}`);
    });
  });
};

// 开始监控当前范围的直播间
const startMonitor = async () => {
  isLoading.value = true;

  // 重置监控状态
  resetMonitorState();

  try {
    const { start, end } = getMonitorRange();
    const roomsToMonitor = liveList.value.slice(start, end);

    console.log(
      `${LOG_TAG} Starting monitor with range ${start}-${end - 1}, rooms: ${
        roomsToMonitor.length
      }`
    );

    // 确保有足够的播放器
    if (playerIds.value.length < roomsToMonitor.length) {
      console.warn(
        `${LOG_TAG} Not enough players: ${playerIds.value.length} < ${roomsToMonitor.length}`
      );
      return;
    }

    // 先断开所有当前连接
    if (currentMonitorRooms.value.length > 0) {
      await stopMonitor();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // 准备房间连接配置
    const connections = roomsToMonitor
      .map((room, index) => {
        const playerId = playerIds.value[index];
        const containerIndex = start + index;
        const viewElementId = `stream_container_${containerIndex}`;

        // 验证容器是否存在
        const containerElement = document.getElementById(viewElementId);
        if (!containerElement) {
          console.warn(
            `${LOG_TAG} Container ${viewElementId} not found for room ${room.RoomId}`
          );
          return null;
        }

        return {
          playerId,
          viewElementId, // 添加viewElementId，在connectToRooms中一起处理
          roomConfig: {
            roomId: room.RoomId,
          },
        };
      })
      .filter(
        (
          connection
        ): connection is {
          playerId: string;
          viewElementId: string;
          roomConfig: { roomId: string };
        } => connection !== null
      );

    // 批量连接房间 - 现在需要支持同时更新视图容器
    const successfulConnections: string[] = [];

    for (const connection of connections) {
      const player = playerManager.getPlayer(connection.playerId);
      if (player) {
        try {
          // 先断开旧连接
          await player.disconnect();
          // 更新视图容器
          await player.updateViewElement(connection.viewElementId);
          // 连接新房间
          await player.connect(connection.roomConfig);

          // 只有连接成功的房间才加入监控列表
          successfulConnections.push(connection.roomConfig.roomId);
          console.log(
            `${LOG_TAG} Successfully connected to room: ${connection.roomConfig.roomId}`
          );
        } catch (error) {
          console.error(
            `${LOG_TAG} Failed to connect room ${connection.roomConfig.roomId}:`,
            error
          );
        }
      }
    }

    // 更新状态 - 只包含成功连接的房间
    currentMonitorRooms.value = successfulConnections;

    // 更新直播间的监控状态 - 基于实际成功连接的房间
    updateRoomMonitorStatus();

    console.log(
      `${LOG_TAG} Monitor completed: ${successfulConnections.length}/${connections.length} rooms connected successfully`
    );

    // 显示正在监控的房间的占位符（直到实际播放开始）
    for (const roomId of successfulConnections) {
      showRoomPlaceholder(roomId);
    }
  } catch (error) {
    console.error(`${LOG_TAG} Start monitor failed:`, error);
    currentMonitorRooms.value = [];
    throw error;
  } finally {
    isLoading.value = false;
  }
};

// 停止监控
const stopMonitor = async () => {
  if (currentMonitorRooms.value.length === 0) {
    console.log(`${LOG_TAG} No monitoring rooms to stop`);
    return;
  }

  try {
    // 先隐藏所有占位符
    currentMonitorRooms.value.forEach((roomId) => {
      const room = liveList.value.find((r) => r.RoomId === roomId);
      if (room) {
        room.shouldShowPlaceholder = false;
      }
    });

    await playerManager.disconnectFromRooms(
      playerIds.value.slice(0, currentMonitorRooms.value.length)
    );

    currentMonitorRooms.value = [];

    // 更新直播间监控状态
    updateRoomMonitorStatus();

    console.log(`${LOG_TAG} All monitoring stopped`);
  } catch (error) {
    console.error(`${LOG_TAG} Stop monitor error:`, error);
    currentMonitorRooms.value = [];
  }
};

// 监听监控起始索引变化，自动重新开始监控
watch(
  () => monitorStartIndex.value,
  async () => {
    if (currentMonitorRooms.value.length > 0) {
      await startMonitor();
    }
  }
);

// 监控下一组
const monitorNextGroup = async () => {
  const totalLives = liveList.value.length;

  if (totalLives <= concurrentMonitors) {
    monitorStartIndex.value = 0;
    return;
  }

  const nextStartIndex = monitorStartIndex.value + concurrentMonitors;

  if (nextStartIndex + concurrentMonitors > totalLives) {
    const endIndex = totalLives;
    const newStartIndex = Math.max(0, endIndex - concurrentMonitors);
    console.log(
      `${LOG_TAG} Next group boundary: ${monitorStartIndex.value} -> ${newStartIndex}`
    );
    monitorStartIndex.value = newStartIndex;
  } else {
    console.log(
      `${LOG_TAG} Next group normal: ${monitorStartIndex.value} -> ${nextStartIndex}`
    );
    monitorStartIndex.value = nextStartIndex;
  }
};

// 监控上一组
const monitorPreviousGroup = async () => {
  const totalLives = liveList.value.length;

  if (totalLives <= concurrentMonitors) {
    monitorStartIndex.value = 0;
    return;
  }

  const prevStartIndex = monitorStartIndex.value - concurrentMonitors;

  if (prevStartIndex < 0) {
    console.log(
      `${LOG_TAG} Prev group boundary: ${monitorStartIndex.value} -> 0`
    );
    monitorStartIndex.value = 0;
  } else {
    console.log(
      `${LOG_TAG} Prev group normal: ${monitorStartIndex.value} -> ${prevStartIndex}`
    );
    monitorStartIndex.value = prevStartIndex;
  }
};

// 销毁直播间
const destroyLiveRoom = async (roomId: string) => {
  try {
    await destroyRoom(roomId);

    // 如果这个房间正在监控中，重新开始监控
    const roomIndex = currentMonitorRooms.value.indexOf(roomId);
    if (roomIndex !== -1) {
      await startMonitor();
    }
  } catch (error) {
    console.error(`${LOG_TAG} Destroy room failed:`, error);
    throw error;
  }
};

// 获取监控范围
const getMonitorRange = () => {
  const totalLives = liveList.value.length;

  if (totalLives === 0) {
    return { start: 0, end: 0 };
  }

  if (totalLives <= concurrentMonitors) {
    return { start: 0, end: totalLives };
  }

  let start = Math.max(0, monitorStartIndex.value);
  let end = Math.min(start + concurrentMonitors, totalLives);

  // 如果接近末尾，调整起始位置以确保显示足够的房间
  if (end === totalLives && start > 0) {
    start = Math.max(0, totalLives - concurrentMonitors);
  }

  // 再次确保端点正确
  if (end - start < concurrentMonitors && start > 0) {
    start = Math.max(0, end - concurrentMonitors);
  }

  return { start, end };
};

// 获取直播列表
const fetchLiveList = async () => {
  if (isLoading.value) {
    console.log(`${LOG_TAG} Already loading, skipping...`);
    return;
  }

  isLoading.value = true;
  try {
    console.log(`${LOG_TAG} Fetching live list with cursor: ${cursor}`);
    const response = await getLiveList({ next: cursor, count: 14 });

    if (response.data?.RoomList && response.data.RoomList.length > 0) {
      // 初始化新房间的占位符状态
      const newRooms = response.data.RoomList.map((room: any) => ({
        ...room,
        shouldShowPlaceholder: false, // 默认不显示占位符
      }));
      
      liveList.value.push(...newRooms);
      cursor = response.data.Next || cursor;

      console.log(`${LOG_TAG} Live list updated:`, {
        newItems: response.data.RoomList.length,
        totalItems: liveList.value.length,
        nextCursor: cursor,
      });
    } else {
      console.log(`${LOG_TAG} No more live rooms available`);
    }
  } catch (error) {
    console.error(`${LOG_TAG} Fetch live list failed:`, error);
    throw error;
  } finally {
    isLoading.value = false;
  }
};

// 切换监控
const switchMonitor = async (
  direction: 'prev' | 'next' | 'refresh' = 'next'
) => {
  if (direction === 'refresh') {
    await startMonitor();
  } else if (direction === 'next') {
    await monitorNextGroup();
  } else if (direction === 'prev') {
    await monitorPreviousGroup();
  }
};

// 更新房间监控状态
const updateRoomMonitorStatus = () => {
  // 清除所有房间的监控状态
  liveList.value.forEach((room) => {
    room.isBeingMonitored = false;
  });

  // 设置当前监控的房间状态
  currentMonitorRooms.value.forEach((roomId) => {
    const room = liveList.value.find((r) => r.RoomId === roomId);
    if (room) {
      room.isBeingMonitored = true;
    }
  });

  console.log(
    `${LOG_TAG} Room monitor status updated, monitoring: ${currentMonitorRooms.value.length} rooms`
  );
};

// 显示房间占位符
const showRoomPlaceholder = (roomId: string) => {
  if (currentMonitorRooms.value.includes(roomId)) {
    const room = liveList.value.find((r) => r.RoomId === roomId);
    if (room) {
      room.shouldShowPlaceholder = true;
      console.log(`${LOG_TAG} Placeholder shown for monitor room: ${roomId}`);
    }
  }
};

// 隐藏房间占位符
const hideRoomPlaceholder = (roomId: string) => {
  if (currentMonitorRooms.value.includes(roomId)) {
    const room = liveList.value.find((r) => r.RoomId === roomId);
    if (room) {
      room.shouldShowPlaceholder = false;
      console.log(`${LOG_TAG} Placeholder hidden for monitor room: ${roomId}`);
    }
  }
};

// 重置监控状态
const resetMonitorState = () => {
  console.log(`${LOG_TAG} Resetting monitor state...`);
  currentMonitorRooms.value = [];
  console.log(`${LOG_TAG} Monitor state reset completed`);
};

// 清理资源
const cleanup = async () => {
  try {
    await stopMonitor();
    await playerManager.destroyAllPlayers();
    console.log(`${LOG_TAG} Cleanup completed`);
  } catch (error) {
    console.error(`${LOG_TAG} Cleanup failed:`, error);
  }
};

// 导出状态和方法
export const useLiveState = () => {
  return {
    // 状态
    liveList,
    isLoading,
    currentMonitorRooms,
    monitorStartIndex,
    concurrentMonitors,
    // 方法
    resetMonitorState,
    startMonitor,
    stopMonitor,
    startMonitorNextGroup: monitorNextGroup,
    startMonitorLastGroup: monitorPreviousGroup,
    fetchLiveList,
    destroyLiveRoom,
    initializePlayers,
    cleanup,
    getPlayerStats: () => playerManager.getPlayerStats(),
    getPlayer: (playerId: string) => playerManager.getPlayer(playerId),
    switchMonitor,
  };
};
