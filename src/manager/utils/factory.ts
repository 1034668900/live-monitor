import { PlayerType } from "../types";
import type { IPlayer, IPlayerFactory, PlayerConfig } from "../types";
import { TrtcPlayer } from "../players/trtc";
import { sdkAppId } from "../../config";

// 播放器工厂实现
export class PlayerFactory implements IPlayerFactory {
  createPlayer(config: PlayerConfig): IPlayer {
    const { type } = config;

    switch (type) {
      case PlayerType.TRTC:
        return new TrtcPlayer({
          ...config,
          sdkAppId: sdkAppId,
        });

      default:
        throw new Error(`Unsupported player type: ${type}`);
    }
  }

  // 获取支持的播放器类型
  getSupportedTypes(): PlayerType[] {
    return [PlayerType.TRTC];
  }

  // 检查播放器类型是否支持
  isSupported(type: PlayerType): boolean {
    return this.getSupportedTypes().includes(type);
  }
}

// 默认播放器工厂实例
export const playerFactory = new PlayerFactory();

// 创建播放器的便捷函数
export function createPlayer(config: PlayerConfig): IPlayer {
  return playerFactory.createPlayer(config);
}

// 获取支持的播放器类型
export function getSupportedPlayerTypes(): PlayerType[] {
  return playerFactory.getSupportedTypes();
}
