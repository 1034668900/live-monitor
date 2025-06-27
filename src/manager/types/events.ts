import { PlayerState } from './player';

// 播放器事件枚举
export enum PlayerEvent {
  STATE_CHANGED = "stateChanged",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  PLAYING = "playing",
  STOPPED = "stopped",
  ERROR = "error",
  RETRY = "retry",
}

// 播放器事件数据
export interface PlayerEventData {
  type: PlayerEvent;
  roomId: string;
  state: PlayerState;
  error?: Error;
  metadata?: Record<string, any>;
}

// 播放器事件回调函数
export type PlayerEventCallback = (data: PlayerEventData) => void;

// 事件监听器管理
export interface EventEmitter {
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
} 