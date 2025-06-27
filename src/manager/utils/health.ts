import { PlayerManager } from '../core/PlayerManager';
import type { PlayerHealth } from '../types';

// 播放器健康检查
export function checkPlayerHealth(manager: PlayerManager): PlayerHealth {
  const stats = manager.getPlayerStats();
  const issues: string[] = [];

  // 检查是否有错误状态的播放器
  if (stats.error > 0) {
    issues.push(`${stats.error} players in error state`);
  }

  // 检查是否有太多空闲播放器
  const idleRate = stats.byState.idle / stats.total;
  if (idleRate > 0.8 && stats.total > 5) {
    issues.push(`High idle rate: ${Math.round(idleRate * 100)}%`);
  }

  // 检查连接率
  const connectedRate = stats.connected / stats.total;
  if (connectedRate < 0.5 && stats.total > 2) {
    issues.push(`Low connection rate: ${Math.round(connectedRate * 100)}%`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    stats,
  };
} 