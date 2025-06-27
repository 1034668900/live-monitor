import { PlayerType, PlayerState, PlayerEvent } from "../types";
import type {
  IPlayer,
  PlayerConfig,
  PlayerStateInfo,
  PlayerEventData,
  PlayerEventCallback,
  RoomConfig,
} from "../types";

/**
 * 抽象播放器基类
 * 提供通用的状态管理、事件系统和生命周期管理
 */
export abstract class BasePlayer implements IPlayer {
  protected readonly LOG_TAG: string;

  public readonly id: string;
  public readonly type: PlayerType;
  protected config: PlayerConfig;
  protected state: PlayerStateInfo;
  protected eventListeners: Map<PlayerEvent, Set<PlayerEventCallback>>;
  protected retryTimer: number | null = null;

  constructor(config: PlayerConfig) {
    this.type = config.type;
    this.config = config;
    this.id = this.generateId();
    this.LOG_TAG = `[${this.type.toUpperCase()}Player]`;

    this.state = {
      state: PlayerState.IDLE,
      roomId: "",
      isConnected: false,
      isPlaying: false,
      retryCount: 0,
      metadata: {},
    };

    this.eventListeners = new Map();

    this.log("Initialized", { id: this.id, config });
  }

  private generateId(): string {
    return `player_${this.config.type}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  getState(): PlayerStateInfo {
    return { ...this.state };
  }

  getInfo() {
    return {
      id: this.id,
      type: this.type,
      userId: this.config.userId,
      viewElementId: this.config.viewElementId,
    };
  }

  on(event: PlayerEvent, callback: PlayerEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: PlayerEvent, callback: PlayerEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  protected emit(event: PlayerEvent, data?: Partial<PlayerEventData>): void {
    const eventData: PlayerEventData = {
      type: event,
      roomId: this.state.roomId,
      state: this.state.state,
      ...data,
    };

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          this.log("Event callback error", { event, error });
        }
      });
    }

    // 总是触发状态变化事件
    if (event !== PlayerEvent.STATE_CHANGED) {
      this.emit(PlayerEvent.STATE_CHANGED, eventData);
    }
  }

  // 更新状态
  protected updateState(newState: Partial<PlayerStateInfo>): void {
    const oldState = this.state.state;
    this.state = { ...this.state, ...newState };

    if (oldState !== this.state.state) {
      this.log("State changed", { from: oldState, to: this.state.state });
      this.emit(PlayerEvent.STATE_CHANGED);
    }
  }

  // 连接到房间
  async connect(roomConfig: RoomConfig): Promise<void> {
    if (this.state.state === PlayerState.DESTROYED) {
      throw new Error("Player has been destroyed");
    }

    if (this.state.isConnected && this.state.roomId === roomConfig.roomId) {
      this.log("Already connected to room", { roomId: roomConfig.roomId });
      return;
    }

    try {
      // 如果已连接到其他房间，先断开
      if (this.state.isConnected) {
        await this.disconnect();
      }

      this.updateState({
        state: PlayerState.CONNECTING,
        roomId: roomConfig.roomId,
      });

      // 执行子类连接房间的方法
      await this.doConnect(roomConfig);

      this.updateState({
        state: PlayerState.CONNECTED,
        isConnected: true,
        retryCount: 0,
      });

      this.emit(PlayerEvent.CONNECTED);
      this.log("Connected successfully", { roomId: roomConfig.roomId });
    } catch (error) {
      this.handleError(error as Error, "connect");
      throw error;
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (!this.state.isConnected) {
      return;
    }

    try {
      this.clearRetryTimer();

      if (this.state.isPlaying) {
        await this.stop();
      }

      // 调用子类断开连接的方法
      await this.doDisconnect();

      this.updateState({
        state: PlayerState.IDLE,
        isConnected: false,
        isPlaying: false,
        roomId: "",
        retryCount: 0,
      });

      this.emit(PlayerEvent.DISCONNECTED);
      this.log("Disconnected successfully");
    } catch (error) {
      this.handleError(error as Error, "disconnect");
      throw error;
    }
  }

  // 开始播放
  async play(): Promise<void> {
    if (!this.state.isConnected) {
      throw new Error("Not connected to any room");
    }

    if (this.state.isPlaying) {
      this.log("Already playing");
      return;
    }

    try {
      // 执行子类开始播放的方法
      await this.doPlay();

      this.updateState({
        state: PlayerState.PLAYING,
        isPlaying: true,
      });

      this.emit(PlayerEvent.PLAYING);
      this.log("Playing started");
    } catch (error) {
      this.handleError(error as Error, "play");
      throw error;
    }
  }

  // 停止播放
  async stop(): Promise<void> {
    if (!this.state.isPlaying) {
      return;
    }

    try {
      await this.doStop();

      this.updateState({
        state: this.state.isConnected
          ? PlayerState.CONNECTED
          : PlayerState.IDLE,
        isPlaying: false,
      });

      this.emit(PlayerEvent.STOPPED);
      this.log("Stopped");
    } catch (error) {
      this.handleError(error as Error, "stop");
      throw error;
    }
  }

  // 暂停播放
  async pause(): Promise<void> {
    if (!this.state.isPlaying) {
      return;
    }

    try {
      // 执行子类暂停播放的方法
      await this.doPause();

      this.updateState({
        state: PlayerState.PAUSED,
      });

      this.log("Paused");
    } catch (error) {
      this.handleError(error as Error, "pause");
      throw error;
    }
  }

  // 恢复播放
  async resume(): Promise<void> {
    if (this.state.state !== PlayerState.PAUSED) {
      return;
    }

    try {
      // 执行子类恢复播放的方法
      await this.doResume();

      this.updateState({
        state: PlayerState.PLAYING,
      });

      this.log("Resumed");
    } catch (error) {
      this.handleError(error as Error, "resume");
      throw error;
    }
  }

  // 更新视图容器
  updateViewElement(elementId: string): void {
    const oldElementId = this.config.viewElementId;
    this.config.viewElementId = elementId;

    // 执行子类更新视图容器的方法
    this.doUpdateViewElement(elementId);

    this.log("View element updated", { from: oldElementId, to: elementId });
  }

  // 销毁播放器
  async destroy(): Promise<void> {
    if (this.state.state === PlayerState.DESTROYED) {
      return;
    }

    try {
      this.clearRetryTimer();

      if (this.state.isConnected) {
        await this.disconnect();
      }

      // 执行子类销毁播放器的方法
      await this.doDestroy();

      this.updateState({ state: PlayerState.DESTROYED });
      this.eventListeners.clear();

      this.log("Destroyed");
    } catch (error) {
      this.log("Destroy error", { error });
      throw error;
    }
  }

  // 处理错误
  protected handleError(error: Error, context: string): void {
    this.log("Error occurred", { error: error.message, context });

    this.updateState({
      state: PlayerState.ERROR,
      lastError: error,
    });

    this.emit(PlayerEvent.ERROR, { error });

    // 自动重试逻辑
    if (this.config.autoRetry && this.shouldRetry(context)) {
      this.scheduleRetry(context);
    }
  }

  // 判断是否应该重试
  protected shouldRetry(context: string): boolean {
    const maxRetryCount = this.config.maxRetryCount || 3;
    return (
      this.state.retryCount < maxRetryCount &&
      ["connect", "play"].includes(context)
    );
  }

  // 安排重试
  protected scheduleRetry(context: string): void {
    this.clearRetryTimer();

    const delay =
      (this.config.retryDelay || 1000) * (this.state.retryCount + 1);

    this.retryTimer = window.setTimeout(async () => {
      this.updateState({ retryCount: this.state.retryCount + 1 });
      this.emit(PlayerEvent.RETRY);

      try {
        if (context === "connect" && this.state.roomId) {
          await this.connect({ roomId: this.state.roomId });
        } else if (context === "play") {
          await this.play();
        }
      } catch (error) {
        this.log("Retry failed", {
          error,
          context,
          retryCount: this.state.retryCount,
        });
      }
    }, delay);
  }

  // 清除重试定时器
  protected clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // 获取视图元素
  protected getViewElement(): HTMLElement | null {
    return document.getElementById(this.config.viewElementId);
  }

  // 日志记录
  protected log(message: string, data?: any): void {
    console.log(`${this.LOG_TAG}[${this.id}] ${message}`, data || "");
  }

  // 抽象方法 - 子类必须实现
  protected abstract doConnect(roomConfig: RoomConfig): Promise<void>;
  protected abstract doDisconnect(): Promise<void>;
  protected abstract doPlay(): Promise<void>;
  protected abstract doStop(): Promise<void>;
  protected abstract doPause(): Promise<void>;
  protected abstract doResume(): Promise<void>;
  protected abstract doUpdateViewElement(elementId: string): void;
  protected abstract doDestroy(): Promise<void>;
}
