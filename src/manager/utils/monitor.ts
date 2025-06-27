import { PlayerManager } from "../core/PlayerManager";
import { PlayerType } from "../types";
import { checkPlayerHealth } from "./health";

// 创建配置好的播放器管理器
export function createPlayerManager(
  playerType: PlayerType = PlayerType.TRTC,
  options?: {
    maxPlayers?: number;
    autoRetry?: boolean;
    maxRetryCount?: number;
    retryDelay?: number;
  },
): PlayerManager {
  const manager = new PlayerManager(playerType);

  // 可以在这里添加其他初始化逻辑
  if (options?.maxPlayers) {
    // 预创建指定数量的播放器
    manager.createPlayers(options.maxPlayers).catch((error) => {
      console.error("Failed to pre-create players:", error);
    });
  }

  return manager;
}

// 播放器性能监控
export class PlayerMonitor {
  private manager: PlayerManager;
  private monitorInterval: number | null = null;
  private callbacks: Array<(health: ReturnType<typeof checkPlayerHealth>) => void> = [];

  constructor(manager: PlayerManager) {
    this.manager = manager;
  }

  // 开始监控
  start(intervalMs: number = 30000): void {
    if (this.monitorInterval) {
      this.stop();
    }

    this.monitorInterval = window.setInterval(() => {
      const health = checkPlayerHealth(this.manager);

      // 调用所有回调函数
      this.callbacks.forEach((callback) => {
        try {
          callback(health);
        } catch (error) {
          console.error("Monitor callback error:", error);
        }
      });

      // 记录健康状态
      if (!health.healthy) {
        console.warn("[PlayerMonitor] Health issues detected:", health.issues);
      }
    }, intervalMs);

    console.log("[PlayerMonitor] Started monitoring");
  }

  // 停止监控
  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log("[PlayerMonitor] Stopped monitoring");
    }
  }

  // 添加健康状态变化回调
  onHealthChange(callback: (health: ReturnType<typeof checkPlayerHealth>) => void): void {
    this.callbacks.push(callback);
  }

  // 移除健康状态变化回调
  offHealthChange(callback: (health: ReturnType<typeof checkPlayerHealth>) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
}

// 创建播放器监控器
export function createPlayerMonitor(manager: PlayerManager): PlayerMonitor {
  return new PlayerMonitor(manager);
}
