// src/api/passbook/passbook.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Passbook endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Passbook/TodayPassbook.java ----
export interface TodayPassbook {
  ResultData?: TodayPassbookResultData;
  Message?: string;
  Code?: string;
}

export interface TodayPassbookResultData {
  Balance?: number;
  Credit?: number;
  Return?: number;
  Expenses?: number;
  EstimatedAmount?: number;
  EarningAmount?: number;
}

// ---- from DTO/Passbook/DailyPassbook.java ----
export interface DailyPassbook {
  ResultData?: DailyPassbookResultData;
  Message?: string;
  Code?: string;
}

export interface DailyPassbookResultData {
  GetCurrentWeekData?: DailyPassbookGetCurrentWeekData[];
  TotalOpening?: number;
  TotalEarned?: number;
  TotalEstimated?: number;
  TotalDeduction?: number;
  TotalCredit?: number;
  TotalExpenses?: number;
}

export interface DailyPassbookGetCurrentWeekData {
  Expenses?: number;
  Estimated?: number;
  Earned?: number;
  Date?: string;
}

// ---- from DTO/Passbook/WeeklyPassbook.java ----
export interface WeeklyPassbook {
  ResultData?: WeeklyPassbookResultData;
  Message?: string;
  Code?: string;
}

export interface WeeklyPassbookResultData {
  WeeklyData?: WeeklyPassbookWeeklyData[];
  TotalOpening?: number;
  TotalEarned?: number;
  TotalEstimated?: number;
  TotalDeduction?: number;
  TotalCredit?: number;
  TotalExpenses?: number;
}

export interface WeeklyPassbookWeeklyData {
  Expenses?: number;
  Estimated?: number;
  Earning?: number;
  Week?: string;
  WeekEnd?: string;
  WeekStart?: string;
}

// ---- from DTO/Passbook/MonthlyPassbook.java ----
export interface MonthlyPassbook {
  ResultData?: MonthlyPassbookResultData;
  Message?: string;
  Code?: string;
}

export interface MonthlyPassbookResultData {
  MonthlyALlDataList?: MonthlyPassbookMonthlyALlDataList[];
  TotalOpening?: number;
  TotalEarned?: number;
  TotalEstimated?: number;
  TotalDeduction?: number;
  TotalCredit?: number;
  TotalExpenses?: number;
}

export interface MonthlyPassbookMonthlyALlDataList {
  Expenses?: number;
  Estimated?: number;
  Earning?: number;
  Month?: string;
  Year?: string;
}

// ---- from DTO/Passbook/YearlyPassbook.java ----
export interface YearlyPassbook {
  ResultData?: YearlyPassbookResultData;
  Message?: string;
  Code?: string;
}

export interface YearlyPassbookResultData {
  GetYearlyData?: YearlyPassbookGetYearlyData[];
  TotalOpening?: number;
  TotalEarned?: number;
  TotalEstimated?: number;
  TotalDeduction?: number;
  TotalCredit?: number;
  TotalExpenses?: number;
}

export interface YearlyPassbookGetYearlyData {
  Expenses?: number;
  Estimate?: number;
  Earned?: number;
  Year?: number;
}

// ---- from DTO/Passbook/UpdatePassbook.java ----
export interface UpdatePassbook {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Task/UpdateTaskWithEarnedAmount.java ----
export interface UpdateTaskWithEarnedAmount {
  Message?: string;
  Code?: string;
}

// ---- request body for POST Passbook/UpdateTaskStatusWithEarnedAmount ----
// (see DTO/Task/UpdateTaskWithEarnedAmountNe.java — the DTO actually used by this endpoint)
export interface UpdateTaskWithEarnedAmountRequest {
  Id: number;
  EarningAmount: number;
  TaskId: any;
  UserId: number;
  Notes?: string;
  TaskState: number;
  TaskStatus: number;
  PaymentTransactionType: string;
  NewWagePerHours: number;
  Task_Excess_Amount_Dtls: UpdateTaskWithEarnedAmountExcessDtl[];
  QRCodeImageFileName?: string;
  QRCodeImageFileBase64Str?: string;
}

export interface UpdateTaskWithEarnedAmountExcessDtl {
  Excess_Amount_Id: number;
  TaskId: any;
  Excess_Amount_Des: string;
  Excess_Amount: number;
  IsActive: boolean;
  UserId: number;
  CreatedBy: number;
  CreatedDate: string;
  UpdatedBy: number;
  UpdatedDate: string;
}

// ---- from DTO/Passbook/EarningDashboard.java ----
export interface EarningDashboard {
  ResultData?: EarningDashboardResultData;
  RecordCount?: number;
  PageSize?: number;
  PageIndex?: number;
  Message?: string;
  Code?: string;
}

export interface EarningDashboardResultData {
  EstimatedAmountYesterDay?: number;
  EarningAmountYesterDay?: number;
  Balance?: number;
  Credit?: number;
  Return?: number;
  Expenses?: number;
  EstimatedAmount?: number;
  EarningAmount?: number;
}
