import { getBasicInfo } from "./basic-info-config";

const sdkAppId = 0; // 输入您的 sdkAppId
const secretKey = ""; // 输入您的 secretKey
const defaultCoverUrl = "https://web.sdk.qcloud.com/trtc/live/web/assets/defaultCover.png"; // 输入您的默认封面图片地址
const concurrentMonitors = 7; // 同时监控的直播间数量


const createBasicAccount = () => {
  return getBasicInfo(
    `live_${Math.ceil(Math.random() * 10000000)}`,
    sdkAppId,
    secretKey,
  );
};

export {
  sdkAppId,
  secretKey,
  concurrentMonitors,
  createBasicAccount,
  defaultCoverUrl,
};
