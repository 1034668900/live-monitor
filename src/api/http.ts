import axios, { type AxiosRequestConfig } from 'axios';
import { RequestMethods } from '../types/room';

const http = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 发送请求
 * @param url      请求地址
 * @param method   请求方法
 * @param data     请求参数
 * @returns
 */
export const sendRequest = async (url: string, method: RequestMethods, data?: any) => {
  try {
    const config: AxiosRequestConfig = {
      url,
      method,
      data,
    };

    const response = await http(config);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('HTTP Error:', error.response.status, error.response.data);
    } else {
      console.error('Network Error:', error.message);
    }
    throw error;
  }
};