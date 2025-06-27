import jetEnv, { num, str } from 'jet-env';
import { isEnumVal } from 'jet-validators';
import { NodeEnvs } from '.';

const Env = jetEnv({
  NodeEnv: isEnumVal(NodeEnvs),
  Port: num,
  SdkSecretKey: str,
  SdkAppId: num,
  Identifier: str,
  Protocol: str,
  Domain: str
});

export { Env };
