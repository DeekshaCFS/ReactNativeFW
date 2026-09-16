// src/api/expenditure/expenditureService.ts
// Auto-generated from URLConstant.java (Expenditure endpoints actually used by the Android app)
// Request/response types sourced from the shared DTO.zip — see expenditure.types.ts
import apiClient from '../apiClient';
import type { AddCredit, AddExpense, DeductBalance, ExpenseDetails, ExpenseDetailsResultData, ExpenseTechList, ExpenseTechListResultData } from './expenditure.types';

// Java's Expenditure/AddCredit and Expenditure/AddDeduction are both
// @FormUrlEncoded — posting a JSON body against them silently no-ops on the
// live API. See src/api/signUp/signUpService.ts for the same fix pattern.
export type UpdateAddCreditRequest = {
  Amount: number;
  CredidDescription?: string;
  GivenBy: number;
  ReceivedBy: number;
};

export type UpdateDeductBalanceRequest = {
  Amount: number;
  Description?: string;
  DeductBy: number;
  UserId: number;
};

/**
 * Source: URLConstant.Expenditure.UPDATE_ADD_CREDIT
 * Endpoint: POST Expenditure/AddCredit
 */
export const updateAddCredit = async (data: UpdateAddCreditRequest): Promise<AddCredit> => {
  const body = new URLSearchParams();
  body.append('Amount', String(data.Amount));
  body.append('CredidDescription', data.CredidDescription ?? '');
  body.append('GivenBy', String(data.GivenBy));
  body.append('ReceivedBy', String(data.ReceivedBy));

  const response = await apiClient.post('Expenditure/AddCredit', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.Expenditure.UPDATE_ADD_EXPENSE
 * Endpoint: POST Expenditure/AddExpense
 */
export const updateAddExpense = async (data?: Partial<AddExpense>): Promise<AddExpense> => {
  const response = await apiClient.post('Expenditure/AddExpense', data);
  return response.data;
};

/**
 * Source: URLConstant.Expenditure.UPDATE_DEDUCT_BALANCE
 * Endpoint: POST Expenditure/AddDeduction
 */
export const updateDeductBalance = async (data: UpdateDeductBalanceRequest): Promise<DeductBalance> => {
  const body = new URLSearchParams();
  body.append('Amount', String(data.Amount));
  body.append('Description', data.Description ?? '');
  body.append('DeductBy', String(data.DeductBy));
  body.append('UserId', String(data.UserId));

  const response = await apiClient.post('Expenditure/AddDeduction', body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
};

/**
 * Source: URLConstant.Expenditure.GET_EXPENSE_USER_LIST
 * Endpoint: GET Expenditure/GetTechnicianList
 */
export const getExpenseUserList = async (params?: Record<string, any>): Promise<ExpenseTechList> => {
  const response = await apiClient.get('Expenditure/GetTechnicianList', { params });
  return response.data;
};

/**
 * Source: URLConstant.Expenditure.GET_EXPENDITURE_DETAILS
 * Endpoint: GET Expenditure/GetTechnicianExpenditure
 */
export const getExpenditureDetails = async (params?: Record<string, any>): Promise<ExpenseDetails> => {
  const response = await apiClient.get('Expenditure/GetTechnicianExpenditure', { params });
  return response.data;
};