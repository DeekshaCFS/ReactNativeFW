// src/api/expenditure/expenditure.types.ts
// Generated from Java DTOs (see DTO.zip) matched to each Expenditure endpoint below.
// Review field types marked 'any' or nested shapes for accuracy against the live API.

// ---- from DTO/Expenditure/AddCredit.java ----
export interface AddCredit {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Expenditure/AddExpense.java ----
export interface AddExpense {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Expenditure/DeductBalance.java ----
export interface DeductBalance {
  Message?: string;
  Code?: string;
}

// ---- from DTO/Expenditure/ExpenseTechList.java ----
export interface ExpenseTechList {
  ResultData?: ExpenseTechListResultData[];
  Message?: string;
  Code?: string;
}

export interface ExpenseTechListResultData {
  Name?: string;
  Photo?: string;
  UserId?: number;
  EarnedAmount?: number;
  RemainingBalance?: number;
  ReturnAmount?: number;
  OpeningBalance?: number;
  CreditedAmonut?: number;
}

// ---- from DTO/Expenditure/ExpenseDetails.java ----
export interface ExpenseDetails {
  ResultData?: ExpenseDetailsResultData;
  Message?: string;
  Code?: string;
}

export interface ExpenseDetailsResultData {
  ExpenseList?: ExpenseDetailsExpenseList[];
  Expenses?: number;
  EarnedAmount?: number;
  RemainingBalance?: number;
  ReturnAmount?: number;
  OpeningBalance?: number;
  CreditedAmonut?: number;
  FullName?: string;
  UserId?: number;
}

export interface ExpenseDetailsExpenseList {
  OwnerId?: number;
  UserName?: string;
  UserId?: number;
  ExpenseName?: string;
  Description?: string;
  Amount?: number;
  ExpenseDate?: string;
  ExpensePhoto?: string;
}
