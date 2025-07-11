import TRTCCloud from "trtc-cloud-js-sdk";
import { BasePlayer } from "../../core/BasePlayer";
import { PlayerType, PlayerState, PlayerEvent } from "../../types";
import type { PlayerConfig, RoomConfig } from "../../types";

// TRTC 的播放器实现
export class TrtcPlayer extends BasePlayer {
  private trtc: TRTCCloud | null = null;
  private isInRoom: boolean = false;
  private sdkAppId: number;
  private currentStreamUrl: string = "";

  constructor(config: PlayerConfig & { sdkAppId: number }) {
    super({ ...config, type: PlayerType.TRTC });

    this.sdkAppId = config.sdkAppId;
    this.log("TRTC Player initialized", { sdkAppId: this.sdkAppId });
  }

  // 初始化TRTC实例
  private initTrtc(): void {
    if (this.trtc) {
      return;
    }

    this.trtc = new TRTCCloud();
    this.trtc.setDefaultStreamRecvMode(false, true);

    // 绑定事件监听器
    this.trtc.on("onUserVideoAvailable", this.handleUserVideoAvailable);
    this.trtc.on("onUserAudioAvailable", this.handleUserAudioAvailable);
    this.trtc.on("onEnterRoom", this.handleEnterRoom);
    this.trtc.on("onExitRoom", this.handleExitRoom);
    this.trtc.on("onError", this.handleTrtcError);
    this.trtc.on("onConnectionStateChanged", this.handleConnectionStateChanged);

    this.log("TRTC instance initialized");
  }

  // 连接到房间
  protected async doConnect(roomConfig: RoomConfig): Promise<void> {
    this.initTrtc();

    if (!this.trtc) {
      throw new Error("Failed to initialize TRTC");
    }

    const enterRoomConfig = {
      strRoomId: roomConfig.roomId,
      userId: this.config.userId,
      userSig: this.config.userSig || "",
      sdkAppId: roomConfig.sdkAppId || this.sdkAppId,
      role: roomConfig.role || 21, // 21: TRTC_ROLE_AUDIENCE
      autoReceiveVideo: roomConfig.autoReceiveVideo !== false,
      autoReceiveAudio: roomConfig.autoReceiveAudio !== false,
    };

    this.log("Entering TRTC room", enterRoomConfig);

    try {
      await this.trtc.enterRoom(enterRoomConfig, 1); // 1: LIVE 场景
    } catch (error) {
      this.log("Failed to enter TRTC room", { error });
      throw error;
    }
  }

  // 断开连接
  protected async doDisconnect(): Promise<void> {
    if (!this.trtc || !this.isInRoom) {
      return;
    }

    try {
      if (this.state.isPlaying) {
        await this.doStop();
      }

      await this.trtc.exitRoom();
      // 实际的断开状态会在onExitRoom回调中处理
    } catch (error) {
      this.log("Failed to exit TRTC room", { error });
      throw error;
    }
  }

  protected async doPlay(): Promise<void> {
    if (!this.trtc) {
      throw new Error("TRTC not initialized");
    }

    if (!this.currentStreamUrl) {
      throw new Error("No stream available to play");
    }

    const viewElement = this.getViewElement();
    if (!viewElement) {
      throw new Error(`View element not found: ${this.config.viewElementId}`);
    }

    try {
      // 先停止当前播放，避免冲突
      await this.trtc.stopRemoteView(this.currentStreamUrl, 0).catch(() => {
        // 忽略错误，流可能未在播放
      });

      // 延迟一小段时间再开始播放
      await new Promise((resolve) => setTimeout(resolve, 50));

      await this.trtc.startRemoteView(this.currentStreamUrl, viewElement, 0);
      this.log("Remote video started");
    } catch (error) {
      this.log("Failed to start remote video", { error });
      throw error;
    }
  }

  // 停止播放
  protected async doStop(): Promise<void> {
    if (!this.trtc || !this.currentStreamUrl) {
      return;
    }

    try {
      await this.trtc.stopRemoteView(this.currentStreamUrl, 0);
      this.log("Remote video stopped");
    } catch (error) {
      this.log("Failed to stop remote video", { error });
      throw error;
    }
  }

  protected async doPause(): Promise<void> {}

  protected async doResume(): Promise<void> {}

  protected doUpdateViewElement(elementId: string): void {
    if (!this.trtc || !this.state.isPlaying || !this.currentStreamUrl) {
      return;
    }

    const viewElement = document.getElementById(elementId);
    if (!viewElement) {
      this.log("View element not found for update", { elementId });
      return;
    }

    try {
      // 重新绑定视频到新的视图元素
      this.trtc
        .stopRemoteView(this.currentStreamUrl, 0)
        .then(() => {
          return this.trtc!.startRemoteView(
            this.currentStreamUrl,
            viewElement,
            0,
          );
        })
        .then(() => {
          this.log("View element updated successfully");
        })
        .catch((error: any) => {
          this.log("Failed to update view element", { error });
        });
    } catch (error) {
      this.log("Failed to update view element", { error });
    }
  }

  protected async doDestroy(): Promise<void> {
    if (this.trtc) {
      // 移除所有事件监听器
      this.trtc.off("onUserVideoAvailable", this.handleUserVideoAvailable);
      this.trtc.off("onUserAudioAvailable", this.handleUserAudioAvailable);
      this.trtc.off("onEnterRoom", this.handleEnterRoom);
      this.trtc.off("onExitRoom", this.handleExitRoom);
      this.trtc.off("onError", this.handleTrtcError);
      this.trtc.off(
        "onConnectionStateChanged",
        this.handleConnectionStateChanged,
      );

      if (this.isInRoom) {
        await this.doDisconnect();
      }

      this.trtc.destroy();
      this.trtc = null;
      this.isInRoom = false;
      this.currentStreamUrl = "";

      this.log("TRTC instance destroyed");
    }
  }

  private handleUserVideoAvailable = (
    streamUrl: string,
    isAvailable: boolean,
  ) => {
    this.log("User video available", { streamUrl, isAvailable });

    if (isAvailable) {
      if (this.currentStreamUrl) {
        this.currentStreamUrl = streamUrl.startsWith('livekit_') ? streamUrl : this.currentStreamUrl;
      } else {
        this.currentStreamUrl = streamUrl
      }
      this.updateState({
        metadata: {
          ...this.state.metadata,
          hasRemoteVideo: true,
          streamUrl,
        },
      });

      // 如果已连接且当前不在播放状态，自动开始播放
      if (this.state.isConnected && !this.state.isPlaying) {
        this.play().catch((error) => {
          this.log("Auto play failed", { error });
        });
      }
    } else {
      this.currentStreamUrl = "";
      this.updateState({
        metadata: {
          ...this.state.metadata,
          hasRemoteVideo: false,
          streamUrl: "",
        },
      });

      // 视频不可用时停止播放
      if (this.state.isPlaying) {
        this.updateState({
          state: PlayerState.CONNECTED,
          isPlaying: false,
        });
        this.emit(PlayerEvent.STOPPED);
      }
    }
  };

  private handleUserAudioAvailable = (
    streamUrl: string,
    isAvailable: boolean,
  ) => {
    this.log("User audio available", { streamUrl, isAvailable });

    this.updateState({
      metadata: {
        ...this.state.metadata,
        hasRemoteAudio: isAvailable,
      },
    });
  };

  private handleEnterRoom = (result: number) => {
    if (result > 0) {
      this.isInRoom = true;
      this.updateState({
        state: PlayerState.CONNECTED,
        isConnected: true,
        retryCount: 0,
      });

      this.emit(PlayerEvent.CONNECTED);
      this.log("Successfully entered TRTC room");
    } else {
      const error = new Error(`Failed to enter room, result: ${result}`);
      this.handleError(error, "connect");
    }
  };

  private handleExitRoom = (reason: number) => {
    this.isInRoom = false;
    this.currentStreamUrl = "";

    this.updateState({
      state: PlayerState.IDLE,
      isConnected: false,
      isPlaying: false,
      roomId: "",
      retryCount: 0,
    });

    this.emit(PlayerEvent.DISCONNECTED);
    this.log("Exited TRTC room", { reason });
  };

  private handleTrtcError = (error: any) => {
    this.log("TRTC error", error);

    const errorObj = new Error(
      `TRTC Error: ${error.errorCode} - ${error.errorMessage}`,
    );
    this.handleError(errorObj, "trtc");
  };

  private handleConnectionStateChanged = (state: any) => {
    this.log("Connection state changed", state);
    // 根据需要处理连接状态变化
  };

  // 获取当前流URL
  public getCurrentStreamUrl(): string {
    return this.currentStreamUrl;
  }
}
