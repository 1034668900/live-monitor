export enum RequestMethods {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE"
}

export type UserInfo = {
  SdkAppId: number;
  UserId: string;
  UserSig: string;
  UserName: string;
  AvatarUrl: string;
}

export type LiveEngineResponse = {
  "ActionStatus": string,
  "ErrorInfo": string,
  "ErrorCode": number,
  "RequestId": string
}