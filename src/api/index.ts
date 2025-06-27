import { RequestMethods } from '../types/room';
import { sendRequest } from './http'

const getLiveList = async (options: {
  next: string,
  count: number
}) => {
  const { next, count = 20 } = options;
  if (count > 20) {
    throw new Error('count must be less than 20');
  }
  const url = `/api/get_live_list?next=${next}&count=${count}`;
  const response = await sendRequest(url, RequestMethods.GET, {});
  return response;
}

const destroyRoom = async (roomId: string) => {
  const url = `/api/destroy_room`;
  const response = await sendRequest(url, RequestMethods.POST, {
    roomId
  });
  return response;
}

export {
  getLiveList,
  destroyRoom
}