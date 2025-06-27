import { UserInfo } from '@src/types';
import LibGenerateTestUserSig from './lib-generate-test-usersig-es.min';

export function getBasicInfo(options: { UserId: string; SdkAppId: number; SdkSecretKey: string; ExpireTime?: number; }): UserInfo | undefined {
  const { UserId, SdkAppId, SdkSecretKey, ExpireTime = 604800 } = options;
  if (SdkAppId === Number(0) || SdkSecretKey === String('')) {
    console.log('Please configure your SdkAppId in config/basic-info-config.js');
    return;
  }
  const generator = new LibGenerateTestUserSig(SdkAppId, SdkSecretKey, ExpireTime);
  const UserSig = generator.genTestUserSig(UserId) || '';
  return {
    SdkAppId,
    UserId,
    UserSig,
    UserName: `myName_${Math.ceil(Math.random() * 100000)}`,
    AvatarUrl: '',
  };
};
