export const URLConstant = {
  Base: {
    // Fill these from your environment or backend config.
    PROTOCOL: 'http://',
    SERVICE_IP: '192.168.3.8',
    DIRECTORY: '/API/api/',
    LEADFORM_LINK: '',
    get BASEURL() {
      return `${this.PROTOCOL}${this.SERVICE_IP}${this.DIRECTORY}`;
    },
    get GET_LINK() {
      return `${this.PROTOCOL}${this.SERVICE_IP}/EnquiryForm/EnquiryForm?Node=`;
    },
  },
  Login: {
    URL_REGISTER_TECH: 'Login/RegisterUser',
    URL_REGISTER_OWNER: 'Login/RegisterOwner',
    FORGOT_PASSWORD: 'Login/ForgottPassword',
    USER_PREFER_LANGUAGE: 'Login/UserPreferredLanguage',
    URL_LOGIN: 'Login/UserLoginMobile',
  },
  SignUp: {
    GET_OTP: 'SignUp/TechOrOwnerSignUpOtp',
    GET_OTP_REGISTER: 'SignUp/TouchlessTempRegistration',
    GET_REGISTER: 'SignUp/RegisterOwner',
  },
  UserPermission: {
    USER_PERMISSIONS: 'UserPermission/GetUserPermission',
  },
  Dashboard: {
    GET_DASHBOARD_DATA: 'Dashboard/GetDashboardData',
  },
  Passbook: {
    GET_PASSBOOK_FOR_DASHBOARD: 'Passbook/GetPassbookDetailsForDashboard',
    GET_TODAY_PASSBOOK: 'Passbook/GetTodaysPassbookByUserId',
    GET_MONTHLY_PASSBOOK_NEW: 'Passbook/GetMonthlyPassbookV2',
    GET_YEARLY_PASSBOOK: 'Passbook/GetYearlyPassbookV2',
  },
  Expenditure: {
    GET_EXPENSE_USER_LIST: 'Expenditure/GetTechnicianList',
  },
  CustomerList: {
    GET_CUSTOMER_LIST: 'CustomerList/GetAllCustomerListForMobile',
  },
  CustomerInquiry: {
    GET_ENQUIRY_LIST: 'CustomerInquiry/GetAllEnquiryListForMobile',
    ADD_ENQUIRY: 'CustomerInquiry/AddCustomerInquiry',
  },
  AMC: {
    GET_AMC_DASHBOARD_COUNT_DETAILS: 'AMCs/AMCDashboardDetailsV2WithFilter',
    GET_AMC_DASHBOARD_WEB: 'AMCs/AMCDashboardDetailsWebV2',
    GET_AMC_REPORT_DETAILS: 'AMCs/AMCReportDetails',
    GET_AMC_DETAILS_FOR_EDIT: 'AMCs/GetAMCDetails',
    GET_AMC_TYPE_LIST: 'AMCs/GetAMCType',
    GET_SERVICE_OCCURRENCE_LIST: 'AMCs/GetAMCServiceOccuranceType',
    GET_REMINDER_MODE_LIST: 'AMCs/GetAMCSetReminders',
    ADD_AMC: 'AMCs/AddAMC',
    PUT_AMC: 'AMCs/PutAMC',
  },
  Task: {
    GET_TASK_LIST_SEARCH_NEW: 'TaskList/AllTasksListByUserId',
    GET_TASK_TAG_LIST: 'Task/GetTaskTagList',
  },
  Item: {
    GET_ALL_LARGE_ITEM_LIST: 'Item/AllItemListAssignAndUnAssign',
    GET_ALL_ITEM_LIST_V2: 'Item/AllItemListAssignAndUnAssignV2',
    GET_ALL_ITEM_LIST: 'Item/AllItemList',
    GET_ALL_ASSIGN_ITEMLIST_TECHWISE: 'Item/GetAllAssignedItemList',
    GET_USED_ITEMLIST: 'Item/GetUsedItemList',
  },
  Lead: {
    GET_ALL_LEAD_LIST: 'Lead/GetAllLeadList',
    GET_LEAD_STATUS_LIST: 'Lead/GetLeadStatusList',
  },
  LeadForm: {
    ADD_CUSTOMER_LEAD: 'LeadForm/AddCustomerLead',
  },
  Services: {
    GET_ENQ_SERVICE_TYPE_LIST: 'Services/GetEnqServiceTypeList',
    GET_ADVANCE_SERVICE_LIST: 'Services/GetAdvanceServiceListByUserId',
  },
  Users: {
    GET_ALL_USER_LIST: 'Users/AllUsersList',
    GET_ALL_EMP_LIST: 'UM_EmployeeList/AllEmployeeListByUserIdAndSearchParam',
    ADD_USER: 'Users/TempRegistration',
    GET_USER_DETAILS: 'Users/GetUsersByUserId',
    UPDATE_USER: 'Users/UpdateUser',
    UPDATE_PROFILE_PIC: 'Users/UploadPhoto',
    CHANGE_PASSWORD: 'Users/UpdatePassword',
    DELETE_USER: 'Users/DeleteUser',
    DELETE_TEMP_REG: 'Users/DeleteTempRegistration',
    ADD_BULK_USERS: 'Users/AddBulkUsersForMobile',
    ADD_BULK_USERS_VALIDATION: 'Users/AddBulkUsersValidation',
    DOWNLOAD_TECH_LIST: 'Users/GetAllTechnicianListDownloadForMobile',
    GET_PROFILE_DETAILS: 'Users/GetProfileDetails',
    AUTHENTICATE_EMAIL: 'Users/IsTechEmailIdExistForUpdateProfile',
    AUTHENTICATE_MOBILE: 'Users/IsMobileNoExistForUpdateProfile',
    DELETE_ACCOUNT: 'Users/DeleteLoginCredentials',
    TRAVELLED_PATH_HISTORY: 'Users/AddPathTravelledHistory',
    GET_CUSTOM_FIELD_DATA: 'Users/Get-CF-FieldDefinitions',
    GET_CUSTOM_FIELD_TYPES: 'Users/Get-CF-FieldTypes',
    POST_TASK_CUSTOM_FIELD: 'Users/Add-Update-CF-FieldDefinitions',
    GET_HNG_CLIENT: 'Users/IsHNGClient',
  },
  UserManagement: {
    POST_BULK_FW: 'UM_EmployeeList/AddEmployeeDetailsForUMList',
  },
} as const;

export const TOUCHLESS_ENDPOINTS = {
  login: URLConstant.Login.URL_LOGIN,
  signUpOtp: URLConstant.SignUp.GET_OTP_REGISTER,
  verifyMobileOtp: URLConstant.Users.AUTHENTICATE_MOBILE,
  verifyEmailOtp: URLConstant.Users.AUTHENTICATE_EMAIL,
  dashboardData: URLConstant.Dashboard.GET_DASHBOARD_DATA,
  dashboardEarning: URLConstant.Passbook.GET_PASSBOOK_FOR_DASHBOARD,
  dashboardAmc: URLConstant.AMC.GET_AMC_DASHBOARD_COUNT_DETAILS,
  dashboardAmcWeb: URLConstant.AMC.GET_AMC_DASHBOARD_WEB,
  amcReportDetails: URLConstant.AMC.GET_AMC_REPORT_DETAILS,
  amcDetailsForEdit: URLConstant.AMC.GET_AMC_DETAILS_FOR_EDIT,
  amcTypes: URLConstant.AMC.GET_AMC_TYPE_LIST,
  amcServiceOccurrenceTypes: URLConstant.AMC.GET_SERVICE_OCCURRENCE_LIST,
  amcReminderModes: URLConstant.AMC.GET_REMINDER_MODE_LIST,
  addAMC: URLConstant.AMC.ADD_AMC,
  putAMC: URLConstant.AMC.PUT_AMC,
  customerList: URLConstant.CustomerList.GET_CUSTOMER_LIST,
  todayPassbook: URLConstant.Passbook.GET_TODAY_PASSBOOK,
  monthlyPassbook: URLConstant.Passbook.GET_MONTHLY_PASSBOOK_NEW,
  yearlyPassbook: URLConstant.Passbook.GET_YEARLY_PASSBOOK,
  expenseTechnicianList: URLConstant.Expenditure.GET_EXPENSE_USER_LIST,
  taskList: URLConstant.Task.GET_TASK_LIST_SEARCH_NEW,
  taskTags: URLConstant.Task.GET_TASK_TAG_LIST,
  itemInventoryList: URLConstant.Item.GET_ALL_LARGE_ITEM_LIST,
  itemListV2: URLConstant.Item.GET_ALL_ITEM_LIST_V2,
  assignedItemList: URLConstant.Item.GET_ALL_ASSIGN_ITEMLIST_TECHWISE,
  usedItemList: URLConstant.Item.GET_USED_ITEMLIST,
  leadStatusList: URLConstant.Lead.GET_LEAD_STATUS_LIST,
  leadList: URLConstant.Lead.GET_ALL_LEAD_LIST,
  leadServiceTypeList: URLConstant.Services.GET_ENQ_SERVICE_TYPE_LIST,
  addCustomerLead: URLConstant.LeadForm.ADD_CUSTOMER_LEAD,
} as const;

export default URLConstant;
