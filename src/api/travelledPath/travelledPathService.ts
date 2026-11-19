// src/api/travelledPath/travelledPathService.ts
import apiClient from '../apiClient';
import type { TravelledPathPoint } from './travelledPath.types';

/**
 * Source: URLConstant.Users.TRAVELLED_PATH_HISTORY (Api.autoSyncTravelledPath, @Body List<ResultData>)
 * Endpoint: POST Users/AddPathTravelledHistory
 */
export const addTravelledPathHistory = async (points: TravelledPathPoint[]) => {
  const response = await apiClient.post('Users/AddPathTravelledHistory', points);
  return response.data;
};