// src/api/userDisclaimer/userDisclaimer.types.ts

export interface GetUserDisclaimer {
  ResultData?: GetUserDisclaimerResultData;
  Message?: string;
  Code?: string;
}

export interface GetUserDisclaimerResultData {
  isAccepted?: boolean;
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  DCN?: string;
  DisclaimerHtml?: string;
  Id?: number;
}

export interface AcceptDisclaimer {
  ResultData?: AcceptDisclaimerResultData;
  Message?: string;
  Code?: string;
}

export interface GetUserDisclaimerParams {
  UserId: number;
}

export interface AcceptDisclaimerRequest {
  UserId: number;
  DCN: string;
}

export interface AcceptDisclaimerResultData {
  UpdatedDate?: string;
  UpdatedBy?: number;
  CreatedDate?: string;
  CreatedBy?: number;
  DCN?: string;
  AcceptedDate?: string;
  isAccepted?: boolean;
  UserId?: number;
  OwnerId?: number;
  UserDisclaimerId?: number;
  Id?: number;
}