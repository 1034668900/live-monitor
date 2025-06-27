import { ref, computed } from 'vue';
import { createBasicAccount } from '../config';

// 用户基本信息接口 - 简化版本
interface SimpleUserInfo {
  userId: string;
  userSig: string;
}

const userList = ref<SimpleUserInfo[]>([]);
const LOG_TAG = '[UserState]';

// 用户统计信息（响应式）
const userStats = computed(() => ({
  total: userList.value.length,
  valid: userList.value.filter(user => user.userId && user.userSig).length
}));

// 创建指定数量的用户账号
const createUsers = (count: number): SimpleUserInfo[] => {
  userList.value = [];
  
  for (let i = 0; i < count; i++) {
    const basicInfo = createBasicAccount();
    if (!basicInfo) continue;
    
    const user: SimpleUserInfo = {
      userId: basicInfo.userId,
      userSig: basicInfo.userSig
    };
    
    userList.value.push(user);
  }
  
  console.log(`${LOG_TAG} Created ${userList.value.length} user accounts`);
  return [...userList.value];
};

// 获取用户信息
const getUserInfo = (userIndex: number): SimpleUserInfo | null => {
  if (userIndex < 0 || userIndex >= userList.value.length) {
    console.warn(`${LOG_TAG} User index ${userIndex} out of range`);
    return null;
  }
  return userList.value[userIndex];
};

// 获取所有用户信息
const getAllUsers = (): SimpleUserInfo[] => {
  return [...userList.value];
};

// 获取用户数量
const getUserCount = (): number => {
  return userList.value.length;
};

// 清理所有用户
const clearUsers = () => {
  userList.value = [];
  console.log(`${LOG_TAG} All users cleared`);
};

// 添加单个用户
const addUser = (): SimpleUserInfo | null => {
  const basicInfo = createBasicAccount();
  if (!basicInfo) {
    console.error(`${LOG_TAG} Failed to create user account`);
    return null;
  }
  
  const user: SimpleUserInfo = {
    userId: basicInfo.userId,
    userSig: basicInfo.userSig
  };
  
  userList.value.push(user);
  console.log(`${LOG_TAG} Added user: ${user.userId}`);
  
  return user;
};

// 移除用户
const removeUser = (userIndex: number): boolean => {
  if (userIndex < 0 || userIndex >= userList.value.length) {
    console.warn(`${LOG_TAG} Cannot remove user at index ${userIndex}`);
    return false;
  }
  
  const removedUser = userList.value.splice(userIndex, 1)[0];
  console.log(`${LOG_TAG} Removed user: ${removedUser.userId}`);
  
  return true;
};

// 验证用户信息
const validateUser = (userIndex: number): boolean => {
  const user = getUserInfo(userIndex);
  if (!user) {
    return false;
  }
  
  return !!(user.userId && user.userSig);
};

export const useUserState = () => {
  return {
    // 响应式数据
    userList,
    userStats,
    
    // 核心方法
    createUsers,
    getUserInfo,
    getAllUsers,
    getUserCount,
    
    // 操作方法
    clearUsers,
    addUser,
    removeUser,
    validateUser
  };
};