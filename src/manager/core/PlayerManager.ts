import { PlayerType, PlayerEvent, PlayerState } from "../types";
import type {
  IPlayer,
  PlayerConfig,
  RoomConfig,
  PlayerEventData,
  PlayerStats,
} from "../types";
import { createPlayer } from "../utils/factory";
import { createBasicAccount } from "../../config";

/**
 * 播放器管理器
 * 负责管理多个播放器实例，提供统一的接口
 */
export class PlayerManager {
  private players: Map<string, IPlayer> = new Map();
  private roomPlayerMap: Map<string, string> = new Map(); // roomId -> playerId
  private defaultPlayerType: PlayerType;

  constructor(defaultPlayerType: PlayerType = PlayerType.TRTC) {
    this.defaultPlayerType = defaultPlayerType;
    this.log("PlayerManager initialized", { defaultPlayerType });
  }

  // 设置默认播放器类型
  setDefaultPlayerType(playerType: PlayerType): void {
    this.defaultPlayerType = playerType;
    this.log("Default player type updated", { playerType });
  }

  // 获取默认播放器类型
  getDefaultPlayerType(): PlayerType {
    return this.defaultPlayerType;
  }

  async createPlayer(config: Omit<PlayerConfig, "type">, playerType?: PlayerType): Promise<string> {
    const actualPlayerType = playerType || this.defaultPlayerType;
    this.log("Creating single player", { config, playerType: actualPlayerType });
    
    const playerConfig: PlayerConfig = {
      type: actualPlayerType,
      userId: config.userId,
      userSig: config.userSig,
      viewElementId: config.viewElementId,
      autoRetry: config.autoRetry !== false,
      maxRetryCount: config.maxRetryCount || 3,
      retryDelay: config.retryDelay || 1000,
      ...config,
    };

    this.log("Player config prepared", { playerConfig });

    try {
      this.log("Calling createPlayer factory");
      const player = createPlayer(playerConfig);
      this.log("Player instance created", { playerId: player.id, type: player.type });

      this.log("Setting up player events");
      this.setupPlayerEvents(player);

      this.log("Storing player in map");
      this.players.set(player.id, player);
      
      this.log("Player created successfully", { 
        playerId: player.id, 
        totalPlayers: this.players.size,
        playerInfo: player.getInfo()
      });

      return player.id;
    } catch (error) {
      this.log("Failed to create player", { 
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        config: playerConfig 
      });
      throw error;
    }
  }

  // 创建多个播放器
  async createPlayers(count: number, playerType?: PlayerType): Promise<string[]> {
    const actualPlayerType = playerType || this.defaultPlayerType;
    const playerIds: string[] = [];

    this.log("Starting to create players", { count, playerType: actualPlayerType });

    for (let i = 0; i < count; i++) {
      try {
        this.log("Creating player", { index: i, playerType: actualPlayerType });
        
        const basicInfo = createBasicAccount();
        if (!basicInfo) {
          this.log("Failed to create basic account", { index: i });
          continue;
        }

        this.log("Basic account created", { 
          index: i, 
          userId: basicInfo.userId, 
          hasUserSig: !!basicInfo.userSig 
        });

        const playerId = await this.createPlayer({
          userId: basicInfo.userId,
          userSig: basicInfo.userSig,
          viewElementId: `stream_container_${i}`,
          autoRetry: true,
        }, actualPlayerType);

        this.log("Player created successfully", { index: i, playerId, playerType: actualPlayerType });
        playerIds.push(playerId);
      } catch (error) {
        this.log("Failed to create player", { 
          index: i, 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          playerType: actualPlayerType
        });
      }
    }

    this.log("Batch players created", {
      requested: count,
      created: playerIds.length,
      playerIds,
      playerType: actualPlayerType,
    });

    return playerIds;
  }

  // 创建指定类型的单个播放器（便捷方法）
  async createTRTCPlayer(config: Omit<PlayerConfig, "type">): Promise<string> {
    return this.createPlayer(config, PlayerType.TRTC);
  }



  // 创建多个指定类型的播放器（便捷方法）
  async createTRTCPlayers(count: number): Promise<string[]> {
    return this.createPlayers(count, PlayerType.TRTC);
  }



  // 获取播放器
  getPlayer(playerId: string): IPlayer | null {
    return this.players.get(playerId) || null;
  }

  // 获取房间对应的播放器
  getPlayerByRoom(roomId: string): IPlayer | null {
    const playerId = this.roomPlayerMap.get(roomId);
    return playerId ? this.getPlayer(playerId) : null;
  }

  // 获取所有播放器
  getAllPlayers(): IPlayer[] {
    return Array.from(this.players.values());
  }

  // 根据播放器类型获取播放器
  getPlayersByType(playerType: PlayerType): IPlayer[] {
    return Array.from(this.players.values()).filter(player => player.type === playerType);
  }

  // 获取所有 TRTC 播放器
  getTRTCPlayers(): IPlayer[] {
    return this.getPlayersByType(PlayerType.TRTC);
  }



  // 连接到房间
  async connectToRoom(playerId: string, roomConfig: RoomConfig): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }

    try {
      // 如果播放器已连接到其他房间，先断开
      const currentState = player.getState();
      if (
        currentState.isConnected &&
        currentState.roomId !== roomConfig.roomId
      ) {
        await player.disconnect();
        await this.delay(200); // 等待断开完成
      }

      await player.connect(roomConfig);

      // 更新房间映射关系
      this.roomPlayerMap.set(roomConfig.roomId, playerId);

      this.log("Player connected to room", {
        playerId,
        roomId: roomConfig.roomId,
      });
    } catch (error) {
      this.log("Failed to connect player to room", {
        playerId,
        roomId: roomConfig.roomId,
        error,
      });
      throw error;
    }
  }

  // 批量连接房间
  async connectToRooms(
    connections: Array<{ playerId: string; roomConfig: RoomConfig }>,
  ): Promise<void> {
    const promises = connections.map(async ({ playerId, roomConfig }) => {
      try {
        await this.connectToRoom(playerId, roomConfig);
      } catch (error) {
        this.log("Batch connect failed for player", {
          playerId,
          roomId: roomConfig.roomId,
          error,
        });
      }
    });

    await Promise.all(promises);
    this.log("Batch room connections completed", { count: connections.length });
  }

  // 断开房间连接
  async disconnectFromRoom(playerId: string): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }

    try {
      const currentState = player.getState();
      const roomId = currentState.roomId;

      await player.disconnect();

      // 移除房间映射关系
      if (roomId) {
        this.roomPlayerMap.delete(roomId);
      }

      this.log("Player disconnected from room", { playerId, roomId });
    } catch (error) {
      this.log("Failed to disconnect player from room", { playerId, error });
      throw error;
    }
  }

  // 批量断开连接
  async disconnectFromRooms(playerIds: string[]): Promise<void> {
    const promises = playerIds.map(async (playerId) => {
      try {
        await this.disconnectFromRoom(playerId);
      } catch (error) {
        this.log("Batch disconnect failed for player", { playerId, error });
      }
    });

    await Promise.all(promises);
    this.log("Batch room disconnections completed", {
      count: playerIds.length,
    });
  }

  // 开始播放
  async startPlay(playerId: string): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }

    try {
      await player.play();
      this.log("Player started playing", { playerId });
    } catch (error) {
      this.log("Failed to start player", { playerId, error });
      throw error;
    }
  }

  // 停止播放
  async stopPlay(playerId: string): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player not found: ${playerId}`);
    }

    try {
      await player.stop();
      this.log("Player stopped playing", { playerId });
    } catch (error) {
      this.log("Failed to stop player", { playerId, error });
      throw error;
    }
  }

  // 销毁播放器
  async destroyPlayer(playerId: string): Promise<void> {
    const player = this.getPlayer(playerId);
    if (!player) {
      return;
    }

    try {
      const currentState = player.getState();
      const roomId = currentState.roomId;

      await player.destroy();

      // 清理映射关系
      this.players.delete(playerId);
      if (roomId) {
        this.roomPlayerMap.delete(roomId);
      }

      this.log("Player destroyed", { playerId, roomId });
    } catch (error) {
      this.log("Failed to destroy player", { playerId, error });
      throw error;
    }
  }

  // 销毁所有播放器
  async destroyAllPlayers(): Promise<void> {
    const playerIds = Array.from(this.players.keys());

    const promises = playerIds.map((playerId) => this.destroyPlayer(playerId));
    await Promise.all(promises);

    this.players.clear();
    this.roomPlayerMap.clear();

    this.log("All players destroyed", { count: playerIds.length });
  }

  // 获取播放器状态统计
  getPlayerStats(): PlayerStats {
    const stats = {
      total: this.players.size,
      connected: 0,
      playing: 0,
      error: 0,
      byState: {
        [PlayerState.IDLE]: 0,
        [PlayerState.CONNECTING]: 0,
        [PlayerState.CONNECTED]: 0,
        [PlayerState.PLAYING]: 0,
        [PlayerState.PAUSED]: 0,
        [PlayerState.STOPPED]: 0,
        [PlayerState.ERROR]: 0,
        [PlayerState.DESTROYED]: 0,
      },
      byType: {
        [PlayerType.TRTC]: 0,
      },
    };

    for (const player of this.players.values()) {
      const state = player.getState();

      stats.byState[state.state]++;
      stats.byType[player.type]++;

      if (state.isConnected) stats.connected++;
      if (state.isPlaying) stats.playing++;
      if (state.state === PlayerState.ERROR) stats.error++;
    }

    return stats;
  }

  // 获取指定类型播放器的统计信息
  getPlayerStatsByType(playerType: PlayerType): {
    total: number;
    connected: number;
    playing: number;
    error: number;
    byState: Record<PlayerState, number>;
  } {
    const players = this.getPlayersByType(playerType);
    const stats = {
      total: players.length,
      connected: 0,
      playing: 0,
      error: 0,
      byState: {
        [PlayerState.IDLE]: 0,
        [PlayerState.CONNECTING]: 0,
        [PlayerState.CONNECTED]: 0,
        [PlayerState.PLAYING]: 0,
        [PlayerState.PAUSED]: 0,
        [PlayerState.STOPPED]: 0,
        [PlayerState.ERROR]: 0,
        [PlayerState.DESTROYED]: 0,
      },
    };

    for (const player of players) {
      const state = player.getState();

      stats.byState[state.state]++;

      if (state.isConnected) stats.connected++;
      if (state.isPlaying) stats.playing++;
      if (state.state === PlayerState.ERROR) stats.error++;
    }

    return stats;
  }

  // 设置播放器事件监听器
  private setupPlayerEvents(player: IPlayer): void {
    player.on(PlayerEvent.CONNECTED, this.handlePlayerConnected);
    player.on(PlayerEvent.DISCONNECTED, this.handlePlayerDisconnected);
    player.on(PlayerEvent.PLAYING, this.handlePlayerPlaying);
    player.on(PlayerEvent.STOPPED, this.handlePlayerStopped);
    player.on(PlayerEvent.ERROR, this.handlePlayerError);
    player.on(PlayerEvent.RETRY, this.handlePlayerRetry);
  }

  private handlePlayerConnected = (data: PlayerEventData) => {
    this.log("Player connected event", data);
  };

  private handlePlayerDisconnected = (data: PlayerEventData) => {
    this.log("Player disconnected event", data);
  };

  private handlePlayerPlaying = (data: PlayerEventData) => {
    this.log("Player playing event", data);
  };

  private handlePlayerStopped = (data: PlayerEventData) => {
    this.log("Player stopped event", data);
  };

  private handlePlayerError = (data: PlayerEventData) => {
    this.log("Player error event", data);
  };

  private handlePlayerRetry = (data: PlayerEventData) => {
    this.log("Player retry event", data);
  };

  // 延迟工具函数
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 日志记录
  private log(message: string, data?: any): void {
    console.log(`[PlayerManager] ${message}`, data || "");
  }
}

// 默认播放器管理器实例
export const playerManager = new PlayerManager();

// 导出播放器管理器的便捷函数
export const usePlayerManager = () => playerManager;
