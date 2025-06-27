import axios, { HttpStatusCode, type Method } from 'axios';
import logger from 'jet-logger';
import { Env } from '@src/common/constants/ENV';
import { getRandomInt } from '@src/common/util';
import { getBasicInfo } from '@src/config/basic-info-config';
import { RequestMethods } from '../types';

const { SdkAppId, SdkSecretKey, Identifier, Protocol, Domain } = Env;

// generate admin user info
const userInfo = getBasicInfo({
  UserId: Identifier,
  SdkAppId,
  SdkSecretKey
});

const requestInterface = {
  destroyRoom: 'v4/live_engine_http_srv/destroy_room',
  fetchLiveList: 'v4/live_engine_http_srv/get_room_list'
}

// create axios instance
const http = axios.create({
  baseURL: `${Protocol}${Domain}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

/**
 * 解散房间
 * @param roomId 待解散房间ID
 * @returns any
 */
const destroyRoom = async (roomId: string) => {
  checkAdmainUserSig();
  const url = `${Protocol}${Domain}/${requestInterface.destroyRoom}?sdkappid=${SdkAppId}&identifier=${Identifier}&usersig=${userInfo!.UserSig}&random=${getRandomInt}&contenttype=json`;
  try {
    const response = await sendRequest(url, RequestMethods.POST, {
      RoomId: roomId
    });
    return { code: response.ErrorCode, message: response.ErrorCode === 0 ? 'success' : response.ErrorInfo };
  } catch (error) {
    throw error;
  }
}

/**
 * 拉取房间列表
 * @param next  下一个房间的起始位置
 * @param count 一次拉取的数量
 * @returns 
 */
const fetchLiveList = async (next: string = '', count: number = 20) => {
  checkAdmainUserSig();
  if (count > 20) {
    throw { code: HttpStatusCode.BadRequest, message: 'count must be less than 20' };
  }
  const url = `${Protocol}${Domain}/${requestInterface.fetchLiveList}?sdkappid=${SdkAppId}&identifier=${Identifier}&usersig=${userInfo!.UserSig}&random=${getRandomInt}&contenttype=json`;
  try {
    const response = await sendRequest(url, RequestMethods.POST, {
      "Next": next,
      "Count": count
    });
    return { code: response.ErrorCode, message: response.ErrorCode === 0 ? 'success' : response.ErrorInfo, data: response.Response };
  } catch (error) {
    throw error;
  }
}

/**
 * 发送请求
 * @param url      请求地址
 * @param method   请求方法
 * @param data     请求参数
 * @returns
 */
const sendRequest = async (url: string, method: Method, data: any = {}) => {
  try {
    const response = await http({
      url,
      method,
      data: method === RequestMethods.GET ? undefined : data,
      params: method === RequestMethods.GET ? data : undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.err(`${url} 请求失败: ${error.message}. params: ${JSON.stringify({ url, method, data })}`);
      throw { code: HttpStatusCode.InternalServerError, message: `Axios API请求失败: ${error.response?.data?.message || error.message}` };
    }
    throw { code: HttpStatusCode.InternalServerError, message: error.message };
  }
}

const checkAdmainUserSig = () => {
  if (!userInfo?.UserSig) {
    throw { code: HttpStatusCode.InternalServerError, message: 'UserSig is undefined' };
  }
}

export {
  destroyRoom,
  fetchLiveList
}