// src/api/userDisclaimer/userDisclaimerService.ts

import apiClient from '../apiClient';
import type {
  AcceptDisclaimer,
  AcceptDisclaimerRequest,
  GetUserDisclaimer,
} from './userDisclaimer.types';

export const getUserDisclaimer = async (userId: number): Promise<GetUserDisclaimer> => {
  const response = await apiClient.get('UserDisclaimer/GetUserDisclaimer', {
    params: { UserId: userId },
  });
  return response.data;
};

export const acceptDisclaimer = async ({
  UserId,
  DCN,
}: AcceptDisclaimerRequest): Promise<AcceptDisclaimer> => {
  const response = await apiClient.post('UserDisclaimer/AcceptUserDisclaimer', {
    UserId,
    isAccepted: true,
    DCN,
  });
  return response.data;
};

export const isDisclaimerAcceptedResponse = (
  res: GetUserDisclaimer | AcceptDisclaimer | undefined
): boolean =>
  !!res &&
  res.Code === '200' &&
  (res.Message ?? '').trim().toLowerCase() === 'successfully.' &&
  !!res.ResultData?.isAccepted;