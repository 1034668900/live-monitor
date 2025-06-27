// 导出基础播放器类
export { BasePlayer } from './BasePlayer';

// 导出播放器管理器
export { PlayerManager } from './PlayerManager';

// 创建播放器管理器实例
import { PlayerManager } from './PlayerManager';

export const playerManager = new PlayerManager();

// 提供便捷的hook
export const usePlayerManager = () => playerManager; 