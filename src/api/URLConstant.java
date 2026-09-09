package com.corefield.fieldweb.Network;

import com.corefield.fieldweb.BuildConfig;

/**
 * Network Controller for STATIC URL
 *
 * @author CoreField
 * @version 1.1
 * @implNote This Network class is used for STATIC URL for different API
 */
public class URLConstant {

    /**
     * Base URL
     */
    public interface Base {
        String BASEURL = "" + BuildConfig.PROTOCOL + BuildConfig.SERVICE_IP + BuildConfig.DIRECTORY;
        String GET_LINK = BuildConfig.GETLINK;
        String LEADFORM_LINK = BuildConfig.GETLEADFORM;
    }

    /**
     * Login URL
     */
    public interface Login {
        //String URL_LOGIN = "Login/LoginUser";
        String URL_REGISTER_TECH = "Login/RegisterUser";
        String URL_REGISTER_OWNER = "Login/RegisterOwner";
        String FORGOT_PASSWORD = "Login/ForgottPassword";
        String USER_PREFER_LANGUAGE = "Login/UserPreferredLanguage";
        //
        String URL_LOGIN = "Login/UserLoginMobile";
    }


    /**
     * SignUp URL
     */
    public interface SignUp {
        String GET_OTP = "SignUp/TechOrOwnerSignUpOtp";
        String GET_OTP_REGISTER = "SignUp/TouchlessTempRegistration";
        String GET_REGISTER = "SignUp/RegisterOwner";
    }

    public interface UserPermission {
        String USER_PERMISSIONS = "UserPermission/GetUserPermission";
    }

    /**
     * User URL
     */
    public interface Users {
        String GET_ALL_USER_LIST = "Users/AllUsersList?";
        String GET_ALL_EMP_LIST = "UM_EmployeeList/AllEmployeeListByUserIdAndSearchParam";
        String ADD_USER = "Users/TempRegistration";
        String GET_USER_DETAILS = "Users/GetUsersByUserId?";
        String UPDATE_USER = "Users/UpdateUser";
        String UPDATE_PROFILE_PIC = "Users/UploadPhoto";
        String CHANGE_PASSWORD = "Users/UpdatePassword";
        String DELETE_USER = "Users/DeleteUser?";
        String DELETE_TEMP_REG = "Users/DeleteTempRegistration?";
        String ADD_BULK_USERS = "Users/AddBulkUsersForMobile";
        String ADD_BULK_USERS_VALIDATION = "Users/AddBulkUsersValidation";
        String DOWNLOAD_TECH_LIST = "Users/GetAllTechnicianListDownloadForMobile?";
        String GET_PROFILE_DETAILS = "Users/GetProfileDetails?";
        String AUTHENTICATE_EMAIL = "Users/IsTechEmailIdExistForUpdateProfile";
        String AUTHENTICATE_MOBILE = "Users/IsMobileNoExistForUpdateProfile";
        String DELETE_ACCOUNT = "Users/DeleteLoginCredentials?";
        String TRAVELLED_PATH_HISTORY = "Users/AddPathTravelledHistory";
        String GET_CUSTOM_FIELD_DATA = "Users/Get-CF-FieldDefinitions";
        String GET_CUSTOM_FIELD_TYPES = "Users/Get-CF-FieldTypes";

        String POST_TASK_CUSTOM_FIELD = "Users/Add-Update-CF-FieldDefinitions";
        String GET_HNG_CLIENT = "Users/IsHNGClient";
    }

    public interface UserManagement {
        String GET_DESIGNATION_TYPE = "UM_Designations/DesignationTypeList";
        String GET_ALL_DESIGNATION = "UM_Designations/GetDesignationAndZoneList";
        String GET_ALL_ZONE_LIST = "UM_ServiceZone/GetAllZoneListByUserId";
        String POST_BULK_FW = "UM_EmployeeList/AddEmployeeDetailsForUMList";
        String GET_MANAGER_LIST_BY_SERVZONE = "UM_ServiceZone/GetManagerListByServiceZone";
        String GET_KYC_LIST = "UM_EmployeeList/GetDocumentTypeListByUserId";
        String UPDATE_EMP_DETAILS = "UM_EmployeeList/UpdateEmployeeDetails";

        String GET_EMP_DETAILS_FOR_EDIT = "UM_EmployeeList/GetEmployeeDetailsForUpdate";

        String DELETE_EMP_ACCOUNT = "Users/DeleteLoginCredentialsList";

    }


    /**
     * Item URL
     */
    public interface Item {
        String GET_ALL_ITEM_ISSUE_LIST = "Item/GetAllAssignedItemsListForAdmin?";
        String GET_ITEM_ISSUE_LIST_BY_USERID = "Item/GetAssignedItemsListByUserId?";

        String GET_USED_ITEM_ISSUE_LIST_BY_USERID = "Item/GetAssignedItemsListForFieldWorker";
        String ADD_ITEM = "Item/AddItem";
        String GET_ALL_ITEM_ASSIGNED_UNASSIGNED = "Item/AllItemListAssignAndUnAssignV2?";

        String GET_ITEM_GROUP = "Item/GetAllItemGroups";

        String GET_ALL_LARGE_ITEM_LIST = "Item/AllItemListAssignAndUnAssign";

        String GET_LARGE_ITEM_ASSIGNED_UNASSIGNED = "Item/AllItemList";
        String ISSUE_ITEM = "Item/AssignItem";
        String ADD_USED_ITEM = "Item/AddUsedItem";
        String DEDUCT_USED_ITEM = "Item/DeductUsedItem";
        String RETURN_ITEM = "Item/UnAssignItemPortal";
        String UNASSIGNED_ITEM = "Item/UnAssignItem";
        String EDIT_ITEM = "Item/UpdateEditItemByItemId";
        String DELETE_ITEM = "Item/DeleteItem?";
        String GET_ITEM_UNIT_TYPE = "Item/GetItemUnitTypes?";
        String GET_ALL_ASSIGN_ITEMLIST_TECHWISE = "Item/GetAllAssignedItemList?";
        String GET_DELETE_ITEM_PORTAL = "Item/DeleteItemPortal?";
        String GET_USED_ITEMLIST = "Item/GetUsedItemList?";
    }

    /**
     * Task URL
     */
    public interface Task {
        String GET_ALLT_TASK = "Task/TaskListAdmin?";
        /*String ADD_TASK = "Task/AddTask";*/
        // String ADD_TASK = "Task/AddTaskWithAudio";
        String ADD_TASK = "TaskList/AddTaskDetails"; // NEW API
        String ADD_TASK_ROUTINE_SERVICE = "Task/TechSelfTaskCreation";
        String UPDATE_TASK_STATUS = "Task/UpdateTaskStatus";
        String DEACTIVATE_TASK = "Task/DeActivatTaskByTaskID?";
        String ACTIVATE_TASK = "Task/ActivatTaskByTaskID?";
        String GET_DEACTIVATE_TASK = "Task/DeActiveTaskList?";
        String ADD_LIVE_LOCATION = "Task/AddLiveLocation";
        String GET_LIVE_LOCATION = "Task/GetLiveLocation?";
        String REASSIGN_TASK = "Task/ReAssignTaskByTaskID";

        String REASSIGN_TASK_NEW = "Task/ReassignTask";
        String GET_TASK_BY_ID = "Task/TaskListByTaskId?";
        String ADD_TASK_CLOSURE = "Task/AddTaskClosureDetails";
        /*String GET_TASK_CLOSURE_DETAILS = "Task/GeTaskClosureList?";*/
        /*OPTIMIZED API*/ String GET_TASK_CLOSURE_DETAILS = "Tasklist/GetTaskClosureList?"; // NEW API
        String GET_REJECTED_TASK_DETAILS = "TaskList/GetTaskClosureList-1";
        String UPDATE_TASK = "Task/UpdateTaskDetailsByTaskID"; // NEW API
        /*String UPDATE_TASK = "Task/UpdateTaskByTaskID";*/
        /*  String GET_TASK_LIST_SEARCH_NEW = "Task/SearchMultipleTask_Android_Or_iOS"; // Change only for Sprint 7.1
          String GET_TODAY_TASK_LIST = "Task/TodayTaskListNew?"; // Change only for Sprint 7.1*/ String GET_TODAY_TASK_LIST = "Task/TodayTaskListNew?";
        String GET_TASK_LIST_SEARCH_NEW = "TaskList/AllTasksListByUserId"; // NEW API

        String GET_TASK_LIST_VALIDATE = "Task/ValidateTaskDetails";

        String ADD_PHOTO_BEFORE_TASK = "Task/AddPreDeviceInfoDetails";
        /*String GET_CRM_TASKLIST = "Task/CRMGetTaskList?";*/ String GET_CRM_TASKLIST = "Task/CRMGetTaskListSearchByParam?";
        String POST_OnHoldTASKDetails = "Task/OnHoldTaskDetails";
        String GET_TASK_TAG_LIST = "Task/GetTaskTagList";

        String UPDATE_REISSUED_ITEMS = "Task/UpdateReIssuedItems";

        String UPLOAD_TASK_DOC = "TaskList/UploadPostTaskDocs";

        String GET_TASK_DOC = "TaskList/GetPostTaskDocs";
        String GET_DOC_ATTACHMENT_TYPE = "TaskList/GetDocumentTypes";

        String GET_TASK_IMAGES = "Task/GetAllTaskListTaskIdWise";
        String GET_BEFORE_AFTER_ONHOLD_TASK_IMG = "TaskList/GetBeforeAfterAndHoldTaskFiles";
    }

    public interface Report {
        String SEND_EMAIL_REPORT = "Report/SendEmailToCustomerPDFReport?";
        String DOWNLOAD_REPORT = "Report/GenerateReportPDF?";
        String DOWNLOAD_AMC_REPORT = "Report/AMCReportPDF?";
    }

    /**
     * Attendance URL
     */
    public interface Attendance {
        String ADD_ATTENDANCE = "Attendance/AddAttendance";
        //String GET_ATTENDANCE_TECH_MONTHLY = "Attendance/GetAttendanceMonthlyForTechnicians?"; // NEW API REPLACED BELOW GetAttendanceRecords
        String GET_ATTENDANCE_TECH_MONTHLY = "Attendance/GetAttendanceRecords?";
        String GET_ATTENDANCE_OWNER_MONTHLY = "Attendance/GetAttendanceMonthlyForAdmin?";
        String ATTENDANCE_CHECK = "Attendance/GetTodayAttandanceIsExist?";
        String ATTENDANCE_CHECK_OUT = "Attendance/CheckOutAttendance?";
    }


    /**
     * Passbook URL
     */
    public interface Passbook {
        String GET_TODAY_PASSBOOK = "Passbook/GetTodaysPassbookByUserId?";
        String GET_DAILY_PASSBOOK = "Passbook/GetDailyOfCurrentWeekPassbook?";
        String GET_WEEKLY_PASSBOOK = "Passbook/GetWeeklyPassbook?";
        String GET_MONTHLY_PASSBOOK_NEW = "Passbook/GetMonthlyPassbookV2?";
        /*String GET_MONTHLY_PASSBOOK = "Passbook/GetMonthlyPassbook?";*/ String GET_MONTHLY_PASSBOOK = "Passbook/GetMonthlyPassbookV2?";
        /*String GET_YEARLY_PASSBOOK = "Passbook/GetYearlyPassbook?";*/ String GET_YEARLY_PASSBOOK = "Passbook/GetYearlyPassbookV2?";
        String UPDATE_PASSBOOK = "Passbook/AddPassbook";
        String UPDATE_TASK_WITH_EARNED_AMOUNT = "Passbook/UpdateTaskStatusWithEarnedAmount";
        String GET_PASSBOOK_FOR_DASHBOARD = "Passbook/GetPassbookDetailsForDashboard?";

    }


    /**
     * Dashboard URL
     */
    public interface Dashboard {
        //        String GET_TASK_STATUS_COUNT_OWN_NEW = "Dashboard/TaskDataStatuswiseV2?";
        String GET_TASK_STATUS_COUNT_OWN_NEW = "Dashboard/GetTaskDataForDashboard?";
        String GET_TASK_STATUS_COUNT_TECH_NEW = "Dashboard/TaskDataStatuswiseByUserIdV2?";

        String GET_DASHBOARD_DATA = "Dashboard/GetDashboardData?";
    }


    /**
     * Expenditure URL
     */
    public interface Expenditure {
        String UPDATE_ADD_CREDIT = "Expenditure/AddCredit";
        String UPDATE_ADD_EXPENSE = "Expenditure/AddExpense";
        String UPDATE_DEDUCT_BALANCE = "Expenditure/AddDeduction";
        String GET_EXPENSE_USER_LIST = "Expenditure/GetTechnicianList?";
        String GET_EXPENDITURE_DETAILS = "Expenditure/GetTechnicianExpenditure?";
    }


    /**
     * Customer Enquiry URL
     */
    public interface CustomerEnquiry {
        String GET_ENQUIRY_LIST = "CustomerInquiry/GetAllEnquiryListForMobile?";
        String ADD_ENQUIRY = "CustomerInquiry/AddCustomerInquiry";
        String UPDATE_ENQUIRY = "CustomerInquiry/UpdateCustomerInquiry";
        String GET_SERVICE_TYPE = "CustomerInquiry/ServiceTypeList";
        String GET_REFERENCE_TYPE = "CustomerInquiry/ReferenceTypeList";

        String GET_CRM_ENQUIRY_LIST = "CustomerInquiry/GetEnquiryListByCustomerId";
    }

    /**
     * Customer URL
     */
    public interface DeviceStatus {
        String ADD_UPDATE_DEVICE_STATUS = "DeviceStatus/AddOrUpdateGPSBatteryStatus";
    }

    /**
     * Customer URL
     */
    public interface Customer {
        String GET_CUSTOMER_LIST = "CustomerList/GetAllCustomerListForMobile?";
        String ADD_CUSTOMER = "CustomerList/AddCustomerDetails";
        String UPDATE_CUSTOMER_DETAILS = "CustomerList/UpdateCustomerDetails";
        String DELETE_CUSTOMER_DETAILS = "CustomerList/DeleteCustomerDetails";
        String GET_CUSTOMER_TAG_LIST = "CustomerList/GetCRMCustomerTagList";
        String GET_STATE_LIST = "CustomerList/Getstates";
        String GET_CITY_LIST = "CustomerList/GetCities";
    }

    /*SERVICE*/
    public interface Services {
        String GET_ServiceTypeList = "Services/GetServiceTypeList";
        String GET_DELETE_SERVICE = "Services/DeleteServiceType";
        String POST_ServiceTypeList = "Services/AddServiceType";
        String UPDATE_ServiceTypeList = "Services/UpdateServiceTypeDetails";
        String GET_EnquiryServiceTypeList = "Services/GetEnqServiceTypeList";

        String GET_ServiceCategoryList = "Services/GetServiceCategoryListByUserId";
        String GET_ServiceSubCategoryList = "Services/GetSubCategoryAndServiceListByCategoryId";
        String GET_Service_Inside_SubCategoryList = "Services/GetServiceListBySubCategoryId";
        String POST_ServiceCategoryList = "Services/AddUpdateServiceCategory";
        String POST_Service_Sub_CategoryList = "Services/AddUpdateServiceSubCategory";
        String DELETE_ServiceCategoryList = "Services/DeleteServiceTypeCategoryList";

        String DELETE_ServiceSubCategoryList = "Services/DeleteServiceSubCategoryList";

    }

    /*ACCOUNT MANAGEMENT*/
    public interface Accounts {
        String GET_QuotationList = "Quotation/getquotationssearchbyparam";
        String POST_QuotationDetails = "Quotation/savequotations";

        String UPDATE_QuotationDetails = "Quotation/updatequotations";
        String GET_QUOTATIONDETAILS_BY_QUOTE_ID = "Quotation/getquotationsbyid";
        /*String GET_TAX_LIST = "Quotation/gettaxlist";*/ String GET_TAX_LIST = "Quotation/gettaxlistforportal";


        String GET_QUOTATION_PDF = "Quotation/getquotationpdfbyid";
        String DELETE_QUOTATION_DETAILS = "Quotation/DeleteQuotationForMobile";
        String UPDATE_QUOTATION_STATUS = "Quotation/UpdateQuotationStatus";

        String GET_INVOICE_PDF = "AccountManagement/GetInvoicePdfById";

        String GET_QUOTE_BIND_LIST = "Quotation/GetQuoteBindList";

        String GET_INVOICEDETAILS_BY_INVOICE_ID = "AccountManagement/GetInvoiceViewDetailsByInvoiceId";/*"AccountManagement/GetInvoiceStatusListById";*/
        String GET_INVOICE_LIST = "AccountManagement/GetInvoiceListSearch";

        String GET_CRM_INVOICE_LIST = "AccountManagement/GetInvoiceListByCustomerId";
        String DELETE_INVOICE_DETAILS = "AccountManagement/DeleteInvoiceByInvoiceId";
        //
        String GET_INVOICE_PAYMENT_STATUS = "AccountManagement/GetPaymentStatusByInvoiceId";
        String SAVE_INVOICE_PAYMMENT_DETAILS = "AccountManagement/SaveInvoicePaymentAmountDetails";
        String INVOICE_FOLLOW_UP_NOTES = "AccountManagement/InvoiceFollowUp";
        String POST_QuotationDetailsNonOwner = "Quotation/SaveQuotationsNonOwner";
        String SELF_InvoiceCreation = "Quotation/SelfInvoiceCreate";
        String TRANSACTION_TPYE = "PaymentTransaction/GetPaymentTransactionTypeList";

        String GET_CRM_QUOTATION_LIST = "Quotation/GetQuotationListByCustomerId";

        String GET_QUOTATION_ID_WISE = "Quotation/getquotationsbyid";

    }

    /*Lead Management*/
    public interface Lead {
        String GET_ALL_LEADList = "Lead/GetAllLeadList";
        String GET_LEADSTATUS_List = "Lead/GetLeadStatusList";
        String GET_LEADETAILS_BY_LEAD_ID = "Lead/GetLeadListByUserIdandLeadId";
        String POST_EXTERNAL_LEAD_FORM = "LeadForm/AddCustomerLead";

        String POST_EXTERNAL_LEAD_FORM_BY_TECH = "LeadForm/AddInternalCustomerLeadByTechnician";
        String UPDATE_LEAD_STATUS = "Lead/UpdateLeadStatus";
        String DELETE_LEAD_DETAILS = "Lead/DeleteILead";
    }

    /*FSR*/
    public interface FSR {
        String GET_FSR_BIND_LIST = "FSRManagement/GetAllFSRListByUserId";
        String GET_ROUTINE_CUSTOMER_LIST = "FSRManagement/GetCustomerDetailsByAssetIdOrCustomerNumber";
        String GET_ALLCHKPOINT_CATEGORY = "FSRManagement/GetAllCheckpointWithCategoriesAndInputFormByTaskId";
        String GET_ALL_CHKPOINT_INPUTFORM_DATA = "FSRManagement/GetSavedSelectedCheckpoint";
        String GET_CHKPOINT_STATUS_NAME = "FSRManagement/GetCheckpointStatusByUserId";

        String POST_CHKPOINT_DATA = "FSRManagement/SaveSelectedCheckpoint";

    }

    /**
     * Notification URL
     */
    public interface Notification {
        String REGISTER_DEVICE_ID = "Notification/RegisterDevice";
        String GET_NOTIFICATION_LIST = "Notification/NotificationList?";
        String UPDATE_NOTIFICATION_IS_READ = "Notification/UpdateNotificationIsReadStatus";
    }


    /**
     * Company Details URL
     */
    public interface CompanyDetails {
        String CHANGE_COMPANY_DETAILS = "CompanyDetails/UpdateComapnyDetails";
        String GET_COMPANY_DETAILS = "CompanyDetails/GetComapnyDetails?";
    }


    /**
     * Health And Safety URL
     */
    public interface HealthAndSafteyDetails {
        String GET_HEALTH_SAFETY_FEATURE_DETAILS = "HealthAndSafety/IsHealthAndSafetyFeatureEnabled?";
        String GET_BODY_TEMP_UNIT_TYPE = "HealthAndSafety/GetBodyTemperatureUnitType";
        String GET_AROGYASETU_STATUS_LIST = "HealthAndSafety/GetArogyaSetuStatusList";
        String ADD_HEALTH_STATUS = "HealthAndSafety/AddHealthStatus";
        String GET_HEALTH_AND_SAFETY_STATUS = "HealthAndSafety/GetHealthAndSafetyStatus?";
        String UPDATE_HEALTH_AND_SAFETY_STATUS = "HealthAndSafety/UpdateHealthAndSafetyStatus";
    }

    /**
     * Disclaimer URL
     */
    public interface Disclaimer {
        String GET_USER_DISCLAIMER = "UserDisclaimer/GetUserDisclaimer?";
        String ACCEPT_DISCLAIMER = "UserDisclaimer/AcceptUserDisclaimer";
    }

    /**
     * AMC URL
     */
    public interface AMC {
        String GET_SERVICE_OCCURRENCE_LIST = "AMCs/GetAMCServiceOccuranceType";
        String GET_REMINDER_MODE_LIST = "AMCs/GetAMCSetReminders";
        String ADD_AMC = "AMCs/AddAMC";
        String GET_AMC_SERVICE_LIST = "AMCs/AMCDashboardDetails";
        String GET_AMC_TYPE_LIST = "AMCs/GetAMCType";
        String GET_AMC_SERVICE_MONTH_LIST = "AMCs/AMCDashboardDetailsWebV2";
        String GET_AMC_REPORT_DETAILS = "AMCs/AMCReportDetails";
        //        String GET_AMC_DASHBOARD_COUNT_DETAILS = "AMCs/AMCDashboardDetailsV2?";
        String GET_AMC_DASHBOARD_COUNT_DETAILS = "AMCs/AMCDashboardDetailsV2WithFilter?";
        String GET_CRM_AMCLIST = "AMCs/CRMGetAMCList?";
        String DELETE_AMC = "AMCs/DeleteAMCListByUserId";
        /*String PUT_AMC_DETAILS = "AMCs/{id}";*/ String PUT_AMC_DETAILS = "AMCs/PutAMC";
        String GET_AMC_DETAILS_FOR_EDIT = "AMCs/GetAMCDetails";
    }

    /*Country List*/
    public interface CountryList {
        String GET_COUNTRY_LIST = "CountryDetails/GetCountryList";
        String GET_COUNTRY_SYMBOL = "CountryDetails/GetCountryExtensionCodeByUserId";
    }

    /**
     * FOC URL
     */
    public interface FOC {
        String GET_FOC_LIST = "FOC_Item_Request/GET_FOC_List";
        String GET_FOC_STATUS_TAG_LIST = "FOC_Item_Request/Get_Foc_Status_Tag_List";
        String GET_FOC_ATTACHMENT_LIST = "FOC_Item_Request/Get_FOC_Att_types_List";
        String POST_FOC_DETAILS = "FOC_Item_Request/Add_FOC_Request_Details";
        String POST_ITEM_DETAILS_STATUS = "FOC_Item_Request/FOC_Request_Details_Update_Status";
        String GET_DELETE_FOC_REQUEST_ITEM = "FOC_Item_Request/DeleteFOC_Request_Items_Details";
        String GET_DELETE_FOC_REQUEST_SUB_ITEM = "FOC_Item_Request/Delete_FOC_Request_Sub_Items";

    }

    /**
     * Leave Management URL
     */
    public interface LeaveManagement {
        String GET_LEAVE_TYPES_LIST = "Leave/GetLeaveTypes";
        String POST_LEAVE_DETAILS = "Leave/LeaveRequest";
        String GET_ALL_EMPLOYEE_LEAVE_LIST = "Leave/AllLeavesListByUserId";
        String POST_LEAVE_APPROV_REJECT = "Leave/Approve-Reject-Leave";
        String DELETE_LEAVE = "Leave/DeleteLeaveDetails";
        String LEAVE_BAL_SUMMARY = "Leave/GetLeaveBalanceSummary";
    }

    public interface PaymentGateway {
        String POST_ONLINE_PAYMENT_DATA = "OnlinePayment/Add-Update-OnlinePaymentLog";
        String GET_PG_ACTIVATION_STATUS = "OnlinePayment/GetPaymentGetwayDetails";

    }
}