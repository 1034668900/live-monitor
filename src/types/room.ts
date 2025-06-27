export interface LiveRoomInfo {
  RoomId: string;
  RoomName: string;
  Owner_Account: string;
  CoverURL: string;
  Category: any[];
  ActivityStatus: number;
  CreateTime: number;
  ViewCount: number;
  Popularity: number;
  IsUnlimitedRoomEnabled: boolean;
  StreamUrl: string;
  isBeingMonitored?: boolean; // 是否正在被监控
  isMonitoring?: boolean; // 是否正在监控中
  shouldShowPlaceholder?: boolean; // 是否应该显示占位符
}

export interface BasicUserInfo {
  sdkAppId: number;
  userId: string;
  userSig: string;
  userName: string;
  avatarUrl: string;
}

export interface UserInfo extends BasicUserInfo {
  trtc: any;
  view: string;
  roomId?: string;
  isInRoom?: boolean;
  isPlaying?: boolean;
  lastRoomId?: string;
  retryCount?: number;
}

export enum RequestMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

