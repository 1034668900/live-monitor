// 播放器类型枚举
export enum PlayerType {
  TRTC = "trtc"
}

// 播放器状态
export enum PlayerState {
  IDLE = "idle", // 空闲状态
  CONNECTING = "connecting", // 连接中
  CONNECTED = "connected", // 已连接
  PLAYING = "playing", // 播放中
  PAUSED = "paused", // 暂停
  STOPPED = "stopped", // 停止
  ERROR = "error", // 错误状态
  DESTROYED = "destroyed", // 已销毁
}

// 播放器配置接口
export interface PlayerConfig {
  type: PlayerType;
  userId: string;
  userSig?: string;
  viewElementId: string;
  autoRetry?: boolean;
  maxRetryCount?: number;
  retryDelay?: number;
  streamValidationTimeout?: number; // 流验证超时时间（毫秒）
  [key: string]: any; // 允许扩展配置
}

// 播放器状态信息
export interface PlayerStateInfo {
  state: PlayerState;
  roomId: string;
  isConnected: boolean;
  isPlaying: boolean;
  retryCount: number;
  lastError?: Error;
  metadata?: Record<string, any>;
}

// 房间连接配置
export interface RoomConfig {
  roomId: string;
  sdkAppId?: number;
  role?: number;
  autoReceiveVideo?: boolean;
  autoReceiveAudio?: boolean;
  [key: string]: any;
}

// 播放器抽象接口
export interface IPlayer {
  readonly id: string;
  readonly type: PlayerType;

  // 获取当前播放器状态
  getState(): PlayerStateInfo;

  // 连接到房间
  connect(roomConfig: RoomConfig): Promise<void>;

  // 断开连接
  disconnect(): Promise<void>;

  play(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;

  // 更新视图容器
  updateViewElement(elementId: string): void;

  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;

  // 获取播放器信息
  getInfo(): {
    id: string;
    type: PlayerType;
    userId: string;
    viewElementId: string;
  };

  // 销毁播放器
  destroy(): Promise<void>;
}

/**
 * 播放器工厂接口
 */
export interface IPlayerFactory {
  createPlayer(config: PlayerConfig): IPlayer;
  getSupportedTypes(): PlayerType[];
}

/**
 * 播放器管理器统计信息
 */
export interface PlayerStats {
  total: number;
  connected: number;
  playing: number;
  error: number;
  byState: Record<PlayerState, number>;
  byType: Record<PlayerType, number>;
  monitor?: {
    total: number;
    current: number;
    startIndex: number;
    isLoading: boolean;
  };
}

/**
 * 播放器健康检查结果
 */
export interface PlayerHealth {
  healthy: boolean;
  issues: string[];
  stats: PlayerStats;
} 