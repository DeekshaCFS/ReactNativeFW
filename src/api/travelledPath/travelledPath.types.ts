// src/api/travelledPath/travelledPath.types.ts
// Source: DTO/TravelPathHistory/TravelledPathHistory.java (ResultData). Posted as an array, as Java's
// AddTravelledPathHistroyAsyncTask does.

export interface TravelledPathPoint {
  Latitude: string;
  Longitude: string;
  LocAddress: string;
  TaskId: number;
  UserID: number;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: number;
  UpdatedDate: string;
}