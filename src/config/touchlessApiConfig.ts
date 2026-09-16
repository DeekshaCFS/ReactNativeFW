import {configureTouchlessApi} from '../api/Api';

// TODO(temp): inlined from URLConstant.ts before it was deleted.
// BASE_URL was: `${PROTOCOL}${SERVICE_IP}${DIRECTORY}` = 'http://' + '192.169.3.8' + '/API/api/'.
const BASE_URL = 'http://192.169.3.8/API/api/';

// Was TOUCHLESS_ENDPOINTS from URLConstant.ts — copied verbatim.
const TOUCHLESS_ENDPOINTS = {
  login: 'Login/UserLoginMobile',
  signUpOtp: 'SignUp/TouchlessTempRegistration',
  verifyMobileOtp: 'Users/IsMobileNoExistForUpdateProfile',
  verifyEmailOtp: 'Users/IsTechEmailIdExistForUpdateProfile',
  dashboardData: 'Dashboard/GetDashboardData',
  dashboardEarning: 'Passbook/GetPassbookDetailsForDashboard',
  dashboardAmc: 'AMCs/AMCDashboardDetailsV2WithFilter',
  dashboardAmcWeb: 'AMCs/AMCDashboardDetailsWebV2',
  amcReportDetails: 'AMCs/AMCReportDetails',
  amcDetailsForEdit: 'AMCs/GetAMCDetails',
  amcTypes: 'AMCs/GetAMCType',
  amcServiceOccurrenceTypes: 'AMCs/GetAMCServiceOccuranceType',
  amcReminderModes: 'AMCs/GetAMCSetReminders',
  addAMC: 'AMCs/AddAMC',
  putAMC: 'AMCs/PutAMC',
  customerList: 'CustomerList/GetAllCustomerListForMobile',
  todayPassbook: 'Passbook/GetTodaysPassbookByUserId',
  monthlyPassbook: 'Passbook/GetMonthlyPassbookV2',
  yearlyPassbook: 'Passbook/GetYearlyPassbookV2',
  expenseTechnicianList: 'Expenditure/GetTechnicianList',
  taskList: 'TaskList/AllTasksListByUserId',
  taskTags: 'Task/GetTaskTagList',
  itemInventoryList: 'Item/AllItemListAssignAndUnAssign',
  itemListV2: 'Item/AllItemListAssignAndUnAssignV2',
  assignedItemList: 'Item/GetAllAssignedItemList',
  usedItemList: 'Item/GetUsedItemList',
  leadStatusList: 'Lead/GetLeadStatusList',
  leadList: 'Lead/GetAllLeadList',
  leadServiceTypeList: 'Services/GetEnqServiceTypeList',
  addCustomerLead: 'LeadForm/AddCustomerLead',
} as const;

// Replace Base constants with your real backend values.
configureTouchlessApi({
  baseUrl: BASE_URL,
  endpoints: TOUCHLESS_ENDPOINTS,
});