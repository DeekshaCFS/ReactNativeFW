import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  type TaskListItem,
  type UserDetailsData,
  type UserDetailsResponse,
  touchlessApi,
} from '../api/Api';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  getCurrentUserProfile,
  getCurrentPreferredLanguage,
  getCurrentUserId,
  logoutAndClearSession,
  setCurrentUserProfile,
} from '../state/session';
import type {RootStackParamList} from './VerifyOTPScreen';
import OwnerDashboardScreen, {type DayFilter} from './OwnerDashboardScreen';
import MainTaskFragmentNewScreen from './MainTaskFragmentNewScreen';
import EmployeeManagementScreen from './EmployeeManagementScreen';
import ItemInventoryTabHostScreen from './ItemInventoryTabHostScreen';
import PassbookExpenditureTabHostScreen from './PassbookExpenditureTabHostScreen';
import LeadListScreen from './LeadListScreen';
import CRMScreen from './CRMScreen';
import AddTaskModal from './AddTaskModal';
import AddItemModal from './AddItemModal';
import AssignItemModal from './AssignItemModal';
import AddFieldworkerModal from './AddFieldworkerModal';
import TaskDetailsScreen from './TaskDetailsScreen';
import ManageBalanceModal from './ManageBalanceModal';
import AccountsScreen from './AccountsScreen';

type BottomTabKey = 'home' | 'task' | 'crm' | 'tech';

type DrawerItem = {
  key: string;
  label: string;
};

type QuickAddItem = {
  key: string;
  label: string;
  icon: string;
};

const QUICK_ADD_ITEMS: QuickAddItem[] = [
  { key: 'add_fieldworker', label: 'Add Fieldworker', icon: '🧑\u200d🔧' },
  { key: 'add_task', label: 'Add Task', icon: '📝' },
  { key: 'add_item', label: 'Add Item', icon: '📦' },
  { key: 'assign_item', label: 'Assign Item', icon: '📤' },
  { key: 'add_enquiry', label: 'Add Enquiry', icon: '❓' },
  { key: 'add_amc', label: 'Add AMC', icon: '🔧' },
  { key: 'manage_balance', label: 'Manage Balance', icon: '💱' },
];

const DRAWER_ITEMS: DrawerItem[] = [
  { key: 'lead', label: 'Leads' },
  { key: 'item_inventory', label: 'Item Inventory' },
  { key: 'passbook', label: 'Passbook' },
  { key: 'amc', label: 'AMC' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'accounts', label: 'Accounts' },
  { key: 'services', label: 'Services' },
  { key: 'help', label: 'Help & Support' },
];
import AMCDashboardScreen from './AMCDashboardScreen';

const TAB_TITLES: Record<BottomTabKey, string> = {
  home: 'FieldWeb',
  task: 'Tasks',
  crm: 'CRM',
  tech: 'Employee List',
};

const LANGUAGE_GREETINGS: Record<string, string> = {
  English: 'Hello',
  Hindi: 'नमस्ते',
  Punjabi: 'ਸੁਆਗਤ ਹੈ',
  Bengali: 'হ্যালো',
  Marathi: 'नमस्कार',
  Kannada: 'ನಮಸ್ಕಾರ',
  Tamil: 'வணக்கம்',
  Telugu: 'హలో',
  Malayalam: 'മലയാളം',
  Arabic: 'مرحبا',
};

const THEME_PRIMARY = '#c3002f';
const DEFAULT_PROFILE_ICON = require('./assets/profile_icon.png');
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type MonthYearOption = {
  month: number;
  year: number;
};

const OwnerDashboard = OwnerDashboardScreen as React.ComponentType<{
  ownerId: number;
  filter: DayFilter;
}>;

const DASHBOARD_FILTERS: DayFilter[] = ['Today', 'Week', 'Month', 'Year'];
const MainTaskFragmentNew = MainTaskFragmentNewScreen as React.ComponentType<{
  userId: number;
  month: number;
  year: number;
  onTaskSelect?: (task: TaskListItem) => void;
}>;
const EmployeeManagement = EmployeeManagementScreen as React.ComponentType<{
  ownerId: number;
}>;
const ItemInventoryTabHost = ItemInventoryTabHostScreen as React.ComponentType<{
  ownerId: number;
  isFieldWorker?: boolean;
}>;
const PassbookExpenditureTabHost =
  PassbookExpenditureTabHostScreen as React.ComponentType<{
    userId: number;
  }>;
const LeadList = LeadListScreen as React.ComponentType<{
  userId: number;
  onMenuPress: () => void;
}>;
const CRM = CRMScreen as React.ComponentType<{
  ownerId: number;
  onMenuPress: () => void;
  openAddEnquiryTrigger?: number;
}>;

const getUserDetailsResultData = (response: UserDetailsResponse) =>
  response?.resultData ?? response?.ResultData ?? null;

const getSafeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const getUserFieldString = (
  userDetails: UserDetailsData | null,
  camelKey: keyof UserDetailsData,
  pascalKey: keyof UserDetailsData,
) => getSafeString(userDetails?.[camelKey] ?? userDetails?.[pascalKey]);

const getGreetingPrefix = (language: string) =>
  LANGUAGE_GREETINGS[language] ?? LANGUAGE_GREETINGS.English;

const buildFullName = (userDetails: UserDetailsData | null) => {
  const firstName = getUserFieldString(userDetails, 'firstName', 'FirstName');
  const lastName = getUserFieldString(userDetails, 'lastName', 'LastName');
  return [firstName, lastName].filter(Boolean).join(' ').trim();
};

const formatPrimaryContact = (userDetails: UserDetailsData | null) => {
  const contactNo = getUserFieldString(userDetails, 'contactNo', 'ContactNo');
  if (contactNo) {
    return contactNo.startsWith('+') ? contactNo : `+91 ${contactNo}`;
  }

  return (
    getUserFieldString(userDetails, 'email', 'Email') || 'No contact details'
  );
};

const getRecentTaskMonthOptions = (): MonthYearOption[] => {
  const now = new Date();
  return Array.from({ length: 3 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (2 - index), 1);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    };
  });
};

const getDefaultTaskMonthYear = () => {
  const options = getRecentTaskMonthOptions();
  return options[options.length - 1];
};

const formatMonthYearLabel = (month: number, year: number) => {
  const monthLabel =
    MONTH_LABELS[Math.max(1, Math.min(12, month)) - 1] ?? '---';
  return `${monthLabel} ${year}`;
};

const hasMonthYearOption = (
  options: MonthYearOption[],
  month: number,
  year: number,
) => options.some(option => option.month === month && option.year === year);

const HomeActivityNewScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const [activeTab, setActiveTab] = useState<BottomTabKey>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAssignItemModalOpen, setIsAssignItemModalOpen] = useState(false);
  const [isAddFieldworkerModalOpen, setIsAddFieldworkerModalOpen] = useState(false);
  const [addEnquiryTrigger, setAddEnquiryTrigger] = useState(0);
  const [addAmcTrigger, setAddAmcTrigger] = useState(0);
  const [isAmcQuickAddOpen, setIsAmcQuickAddOpen] = useState(false);
  const [isManageBalanceModalOpen, setIsManageBalanceModalOpen] = useState(false);
  const [selectedDrawerLabel, setSelectedDrawerLabel] = useState('Dashboard');
  const [isUserDetailsLoading, setIsUserDetailsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(() => {
    return getCurrentUserProfile().details;
  });
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(false);
  const [taskMonthYear, setTaskMonthYear] = useState(getDefaultTaskMonthYear);
  const [selectedTaskDetail, setSelectedTaskDetail] =
    useState<TaskListItem | null>(null);
  const [isTaskMonthPickerOpen, setIsTaskMonthPickerOpen] = useState(false);
  const [pendingTaskMonth, setPendingTaskMonth] = useState(
    () => taskMonthYear.month,
  );
  const [pendingTaskYear, setPendingTaskYear] = useState(
    () => taskMonthYear.year,
  );
  const [dashboardFilter, setDashboardFilter] = useState<DayFilter>('Today');
  const [isDashboardFilterOpen, setIsDashboardFilterOpen] = useState(false);

  const ownerId = getCurrentUserId();
  const taskMonthOptions = useMemo(() => getRecentTaskMonthOptions(), []);
  const taskYearOptions = useMemo(
    () =>
      Array.from(new Set(taskMonthOptions.map(option => option.year))).sort(
        (first, second) => second - first,
      ),
    [taskMonthOptions],
  );
  const pendingMonthOptions = useMemo(
    () => taskMonthOptions.filter(option => option.year === pendingTaskYear),
    [pendingTaskYear, taskMonthOptions],
  );

  const preferredLanguage = useMemo(() => getCurrentPreferredLanguage(), []);

  const toolbarTitle = useMemo(() => {
    if (selectedDrawerLabel !== 'Dashboard') {
      return selectedDrawerLabel;
    }

    return TAB_TITLES[activeTab];
  }, [activeTab, selectedDrawerLabel]);

  const isTaskDetailView = activeTab === 'task' && !!selectedTaskDetail;
  const isTaskDashboard =
    activeTab === 'task' &&
    selectedDrawerLabel === 'Dashboard' &&
    !isTaskDetailView;
  const isEmployeeDashboard =
    activeTab === 'tech' && selectedDrawerLabel === 'Dashboard';
  const isItemInventorySection = selectedDrawerLabel === 'Item Inventory';
  const isPassbookSection = selectedDrawerLabel === 'Passbook';
  const isAMCSection = selectedDrawerLabel === 'AMC';
  const isLeadSection = selectedDrawerLabel === 'Leads';
  const isAccountsSection = selectedDrawerLabel === 'Accounts';
  const isCrmSection = activeTab === 'crm' && selectedDrawerLabel === 'Dashboard';
  const isHomeDashboard = activeTab === 'home' && selectedDrawerLabel === 'Dashboard';

  const isFieldWorkerUser = useMemo(() => {
    const roleDetails = userDetails as
      | (UserDetailsData & {
          userGroupCodeId?: number | null;
          userGroupId?: number | null;
          userGroupName?: string | null;
          UserGroupCodeId?: number | null;
          UserGroupId?: number | null;
          UserGroupName?: string | null;
        })
      | null;
    const userGroupName = String(
      roleDetails?.userGroupName ?? roleDetails?.UserGroupName ?? '',
    )
      .trim()
      .toLowerCase();
    const userGroupId = Number(
      roleDetails?.userGroupId ??
        roleDetails?.UserGroupId ??
        roleDetails?.userGroupCodeId ??
        roleDetails?.UserGroupCodeId,
    );

    return (
      userGroupName.includes('field') ||
      userGroupName.includes('technician') ||
      userGroupId === 4
    );
  }, [userDetails]);

  useEffect(() => {
    if (!isTaskDashboard) {
      setIsTaskMonthPickerOpen(false);
    }
  }, [isTaskDashboard]);

  useEffect(() => {
    if (!isTaskMonthPickerOpen) {
      return;
    }

    setPendingTaskMonth(taskMonthYear.month);
    setPendingTaskYear(taskMonthYear.year);
  }, [isTaskMonthPickerOpen, taskMonthYear.month, taskMonthYear.year]);

  const fullName = useMemo(() => {
    return buildFullName(userDetails) || 'User';
  }, [userDetails]);

  const firstName = useMemo(() => {
    return (
      getUserFieldString(userDetails, 'firstName', 'FirstName') || fullName
    );
  }, [fullName, userDetails]);

  const greetingText = useMemo(() => {
    return `${getGreetingPrefix(preferredLanguage)}, ${firstName}`;
  }, [firstName, preferredLanguage]);

  const primaryContact = useMemo(() => {
    return formatPrimaryContact(userDetails);
  }, [userDetails]);

  const profileImageUri = useMemo(() => {
    if (useDefaultAvatar) {
      return '';
    }

    return getUserFieldString(userDetails, 'photo', 'Photo');
  }, [useDefaultAvatar, userDetails]);

  useEffect(() => {
    setUseDefaultAvatar(false);
  }, [profileImageUri]);

  useEffect(() => {
    let isMounted = true;

    const loadUserDetails = async () => {
      setIsUserDetailsLoading(true);

      try {
        const response = await touchlessApi.getUserDetails({ userId: ownerId });
        const resultData = getUserDetailsResultData(response);

        if (!isMounted || !resultData) {
          return;
        }

        setCurrentUserProfile(resultData);
        setUserDetails(resultData);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load user details right now.';
        Alert.alert('User details error', message);
      } finally {
        if (isMounted) {
          setIsUserDetailsLoading(false);
        }
      }
    };

    loadUserDetails();

    return () => {
      isMounted = false;
    };
  }, [ownerId]);

  const handleTabPress = (tab: BottomTabKey) => {
    setActiveTab(tab);
    setSelectedDrawerLabel('Dashboard');
    setSelectedTaskDetail(null);
  };

  const handleFabPress = () => {
    setIsQuickAddModalOpen(true);
  };

  const handleQuickAddItemPress = (item: QuickAddItem) => {
    setIsQuickAddModalOpen(false);
    if (item.key === 'add_task') {
      setIsAddTaskModalOpen(true);
    } else if (item.key === 'add_item') {
      setIsAddItemModalOpen(true);
    } else if (item.key === 'assign_item') {
      setIsAssignItemModalOpen(true);
    } else if (item.key === 'add_fieldworker') {
      setIsAddFieldworkerModalOpen(true);
    } else if (item.key === 'add_enquiry') {
      setActiveTab('crm');
      setSelectedDrawerLabel('Dashboard');
      setAddEnquiryTrigger(previous => previous + 1);
    } else if (item.key === 'add_amc') {
      setIsAmcQuickAddOpen(true);
      setAddAmcTrigger(previous => previous + 1);
    } else if (item.key === 'manage_balance') {
      setIsManageBalanceModalOpen(true);
    }
  };

  const handleDrawerItemPress = (item: DrawerItem) => {
    setSelectedDrawerLabel(item.label);
    setIsDrawerOpen(false);
    setSelectedTaskDetail(null);
  };

  const handleLogout = () => {
    setIsDrawerOpen(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logoutAndClearSession();
          navigation.reset({index: 0, routes: [{name: 'Login'}]});
        },
      },
    ]);
  };

  const renderContent = () => {
    if (isItemInventorySection) {
      return (
        <ItemInventoryTabHost
          ownerId={ownerId}
          isFieldWorker={isFieldWorkerUser}
        />
      );
    }

    if (isPassbookSection) {
      return <PassbookExpenditureTabHost userId={ownerId} />;
    }

    if (isLeadSection) {
      return (
        <LeadList
          userId={ownerId}
          onMenuPress={() => setIsDrawerOpen(true)}
        />
      );
    }

    if (isAccountsSection) {
      return (
        <AccountsScreen
          ownerId={ownerId}
          onMenuPress={() => setIsDrawerOpen(true)}
        />
      );
    }

    if (isCrmSection) {
      return (
        <CRM
          ownerId={ownerId}
          onMenuPress={() => setIsDrawerOpen(true)}
          openAddEnquiryTrigger={addEnquiryTrigger}
        />
      );
    }

    if (isAMCSection) {
      return (
        <AMCDashboardScreen
          ownerId={ownerId}
          onMenuPress={() => setIsDrawerOpen(true)}
          openAddAmcTrigger={addAmcTrigger}
        />
      );
    }

    if (selectedDrawerLabel !== 'Dashboard') {
      return (
        <View style={styles.contentCard}>
          <Text style={styles.contentTitle}>{selectedDrawerLabel}</Text>
          <Text style={styles.contentText}>
            This section is converted from `HomeActivityNew` navigation and is
            ready for feature-specific React Native components.
          </Text>
        </View>
      );
    }

    if (activeTab === 'home') {
      return <OwnerDashboard ownerId={ownerId} filter={dashboardFilter} />;
    }

    if (activeTab === 'task' && selectedTaskDetail) {
      const record = selectedTaskDetail as Record<string, unknown>;
      const taskId = Number(record.id ?? record.Id) || 0;
      const customerName =
        typeof record.customerName === 'string'
          ? record.customerName
          : typeof record.CustomerName === 'string'
          ? record.CustomerName
          : '';
      const customerPhone =
        typeof record.contactNo === 'string'
          ? record.contactNo
          : typeof record.ContactNo === 'string'
          ? record.ContactNo
          : '';
      const customerAddress =
        typeof record.fullAddress === 'string'
          ? record.fullAddress
          : typeof record.FullAddress === 'string'
          ? record.FullAddress
          : '';
      return (
        <TaskDetailsScreen
          ownerId={ownerId}
          taskId={taskId}
          fallbackTask={selectedTaskDetail}
          customerName={customerName}
          customerPhone={customerPhone}
          customerAddress={customerAddress}
          onBack={() => setSelectedTaskDetail(null)}
        />
      );
    }

    if (activeTab === 'task') {
      return (
        <MainTaskFragmentNew
          userId={ownerId}
          month={taskMonthYear.month}
          year={taskMonthYear.year}
          onTaskSelect={setSelectedTaskDetail}
        />
      );
    }

    if (activeTab === 'tech') {
      return <EmployeeManagement ownerId={ownerId} />;
    }

    return (
      <View style={styles.contentCard}>
        <Text style={styles.contentTitle}>{TAB_TITLES[activeTab]}</Text>
        <Text style={styles.contentText}>
          Fragment container equivalent from `activity_main_new.xml`.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isHomeDashboard ? styles.containerHomeBackground : null,
      ]}
    >
      <View
        style={[
          styles.container,
          isHomeDashboard ? styles.containerHomeBackground : null,
        ]}
      >
        {isTaskDashboard ? (
          <View style={styles.taskHeader}>
            <View style={styles.taskToolbar}>
              <TouchableOpacity
                onPress={() => setIsDrawerOpen(true)}
                style={styles.taskToolbarMenu}
              >
                <Text style={styles.taskToolbarMenuText}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.taskToolbarTitle}>Tasks</Text>
              <View style={styles.taskToolbarActions}>
                <Text style={styles.taskToolbarIcon}>⌖</Text>
                <Text style={styles.taskToolbarIcon}>♬</Text>
                <Text style={styles.taskToolbarIcon}>♢</Text>
              </View>
            </View>
            <View
              style={styles.taskMonthRow}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() => setIsTaskMonthPickerOpen(true)}
            >
              <Text style={styles.taskMonthText}>
                {formatMonthYearLabel(taskMonthYear.month, taskMonthYear.year)}
              </Text>
              <Text style={styles.taskMonthArrow}>⌄</Text>
            </View>
          </View>
        ) : isEmployeeDashboard ? (
          <View style={styles.employeeHeader}>
            <TouchableOpacity
              onPress={() => setIsDrawerOpen(true)}
              style={styles.employeeToolbarMenu}
            >
              <Text style={styles.employeeToolbarMenuText}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.employeeToolbarTitle}>Employee List</Text>
            <View style={styles.employeeToolbarActions}>
              <Text style={styles.employeeToolbarIcon}>♬</Text>
              <Text style={styles.employeeToolbarIcon}>♢</Text>
            </View>
          </View>
        ) : isAMCSection || isLeadSection || isAccountsSection || isCrmSection || isTaskDetailView ? null : isItemInventorySection ||
          isPassbookSection ? (
          <View style={styles.toolbar}>
            <TouchableOpacity
              onPress={() => setIsDrawerOpen(true)}
              style={styles.toolbarIconButton}
            >
              <Text style={styles.toolbarIcon}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.toolbarTitle}>{toolbarTitle}</Text>
            <View style={styles.toolbarRightSpace} />
          </View>
        ) : (
          <>
            <View style={styles.toolbar}>
              <TouchableOpacity
                onPress={() => setIsDrawerOpen(true)}
                style={styles.toolbarIconButton}
              >
                <Text style={styles.toolbarIcon}>☰</Text>
              </TouchableOpacity>
              <Text style={styles.toolbarTitle}>{toolbarTitle}</Text>
              <View style={styles.toolbarRightIcons}>
                <TouchableOpacity style={styles.toolbarIconButton}>
                  <Text style={styles.toolbarIcon}>🎧</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.toolbarIconButton}>
                  <Text style={styles.toolbarIcon}>🔔</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <Text numberOfLines={1} style={styles.headerName}>
                  {greetingText}
                </Text>
                <Pressable
                  style={styles.headerFilterControl}
                  onPress={() => setIsDashboardFilterOpen(true)}
                >
                  <Text style={styles.headerFilterLabel}>{dashboardFilter}</Text>
                  <Text style={styles.headerFilterArrow}>▼</Text>
                </Pressable>
              </View>
              {isUserDetailsLoading ? (
                <View style={styles.headerLoaderRow}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.headerLoaderText}>
                    Refreshing profile...
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        )}

        {isTaskDashboard ||
        isEmployeeDashboard ||
        isItemInventorySection ||
        isPassbookSection ||
        isLeadSection ||
        isCrmSection ||
        isAMCSection ? (
          <View style={styles.taskContentContainer}>{renderContent()}</View>
        ) : (
          <ScrollView
            style={styles.homeScrollView}
            contentContainerStyle={styles.contentContainer}
          >
            {renderContent()}
          </ScrollView>
        )}

        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => handleTabPress('home')}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'home' ? styles.tabLabelActive : null,
              ]}
            >
              ⌂
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'home' ? styles.tabLabelActive : null,
              ]}
            >
              Home
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress('task')}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'task' ? styles.tabLabelActive : null,
              ]}
            >
              ▤
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'task' ? styles.tabLabelActive : null,
              ]}
            >
              Task
            </Text>
          </Pressable>
          <View style={styles.tabFabGap} />
          <Pressable
            onPress={() => handleTabPress('crm')}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'crm' ? styles.tabLabelActive : null,
              ]}
            >
              👥
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'crm' ? styles.tabLabelActive : null,
              ]}
            >
              CRM
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabPress('tech')}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabIcon,
                activeTab === 'tech' ? styles.tabLabelActive : null,
              ]}
            >
              ₹
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'tech' ? styles.tabLabelActive : null,
              ]}
            >
              Employee
            </Text>
          </Pressable>
        </View>

        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isTaskMonthPickerOpen}
        onRequestClose={() => setIsTaskMonthPickerOpen(false)}
      >
        <Pressable
          style={styles.monthPickerBackdrop}
          onPress={() => setIsTaskMonthPickerOpen(false)}
        >
          <Pressable style={styles.monthPickerPanel} onPress={() => {}}>
            <View style={styles.monthPickerHeader}>
              <Text style={styles.monthPickerTitle}>Select month</Text>
              <Text style={styles.monthPickerSubtitle}>
                {formatMonthYearLabel(pendingTaskMonth, pendingTaskYear)}
              </Text>
            </View>

            <View style={styles.monthPickerBody}>
              <View style={styles.monthPickerColumn}>
                <Text style={styles.monthPickerColumnTitle}>Month</Text>
                <ScrollView style={styles.monthPickerList}>
                  {pendingMonthOptions.map(option => {
                    const value = option.month;
                    const label = MONTH_LABELS[value - 1] ?? '---';
                    const selected =
                      value === pendingTaskMonth &&
                      option.year === pendingTaskYear;
                    return (
                      <Pressable
                        key={`${option.year}-${option.month}`}
                        onPress={() => setPendingTaskMonth(value)}
                        style={[
                          styles.monthPickerItem,
                          selected ? styles.monthPickerItemSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthPickerItemText,
                            selected
                              ? styles.monthPickerItemTextSelected
                              : null,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.monthPickerColumn}>
                <Text style={styles.monthPickerColumnTitle}>Year</Text>
                <ScrollView style={styles.monthPickerList}>
                  {taskYearOptions.map(value => {
                    const selected = value === pendingTaskYear;
                    return (
                      <Pressable
                        key={String(value)}
                        onPress={() => {
                          const optionsForYear = taskMonthOptions.filter(
                            option => option.year === value,
                          );
                          const matchingMonth = optionsForYear.find(
                            option => option.month === pendingTaskMonth,
                          );
                          const fallbackMonth =
                            matchingMonth ??
                            optionsForYear[optionsForYear.length - 1];

                          setPendingTaskYear(value);
                          if (fallbackMonth) {
                            setPendingTaskMonth(fallbackMonth.month);
                          }
                        }}
                        style={[
                          styles.monthPickerItem,
                          selected ? styles.monthPickerItemSelected : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthPickerItemText,
                            selected
                              ? styles.monthPickerItemTextSelected
                              : null,
                          ]}
                        >
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.monthPickerFooter}>
              <Pressable
                onPress={() => setIsTaskMonthPickerOpen(false)}
                style={styles.monthPickerButton}
              >
                <Text style={styles.monthPickerButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (
                    hasMonthYearOption(
                      taskMonthOptions,
                      pendingTaskMonth,
                      pendingTaskYear,
                    )
                  ) {
                    setTaskMonthYear({
                      month: pendingTaskMonth,
                      year: pendingTaskYear,
                    });
                  }
                  setIsTaskMonthPickerOpen(false);
                }}
                style={[
                  styles.monthPickerButton,
                  styles.monthPickerButtonPrimary,
                ]}
              >
                <Text
                  style={[
                    styles.monthPickerButtonText,
                    styles.monthPickerButtonTextPrimary,
                  ]}
                >
                  OK
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isDashboardFilterOpen}
        onRequestClose={() => setIsDashboardFilterOpen(false)}
      >
        <Pressable
          style={styles.dashboardFilterBackdrop}
          onPress={() => setIsDashboardFilterOpen(false)}
        >
          <Pressable style={styles.dashboardFilterPanel} onPress={() => {}}>
            {DASHBOARD_FILTERS.map(option => {
              const selected = option === dashboardFilter;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setDashboardFilter(option);
                    setIsDashboardFilterOpen(false);
                  }}
                  style={[
                    styles.dashboardFilterItem,
                    selected ? styles.dashboardFilterItemSelected : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dashboardFilterItemText,
                      selected ? styles.dashboardFilterItemTextSelected : null,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <Pressable
          style={styles.drawerBackdrop}
          onPress={() => setIsDrawerOpen(false)}
        >
          <Pressable style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Image
                source={
                  profileImageUri
                    ? { uri: profileImageUri }
                    : DEFAULT_PROFILE_ICON
                }
                style={styles.drawerAvatar}
                onError={() => setUseDefaultAvatar(true)}
              />
              <Text numberOfLines={1} style={styles.drawerName}>
                {fullName}
              </Text>
              <Text numberOfLines={1} style={styles.drawerContact}>
                {primaryContact}
              </Text>
              <Text style={styles.drawerTitle}>Menu</Text>
            </View>
            {DRAWER_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.drawerItem}
                onPress={() => handleDrawerItemPress(item)}
              >
                <Text style={styles.drawerItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isQuickAddModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsQuickAddModalOpen(false)}
      >
        <Pressable
          style={styles.quickAddBackdrop}
          onPress={() => setIsQuickAddModalOpen(false)}
        >
          <Pressable style={styles.quickAddPanel}>
            <TouchableOpacity
              style={styles.quickAddCloseButton}
              onPress={() => setIsQuickAddModalOpen(false)}
            >
              <Text style={styles.quickAddCloseIcon}>✕</Text>
            </TouchableOpacity>
            {QUICK_ADD_ITEMS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={styles.quickAddItem}
                onPress={() => handleQuickAddItemPress(item)}
              >
                <Text style={styles.quickAddItemIcon}>{item.icon}</Text>
                <Text style={styles.quickAddItemLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <AddTaskModal
        visible={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        ownerId={ownerId}
      />

      <AddItemModal
        visible={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        ownerId={ownerId}
      />

      <AssignItemModal
        visible={isAssignItemModalOpen}
        onClose={() => setIsAssignItemModalOpen(false)}
        ownerId={ownerId}
      />

      <AddFieldworkerModal
        visible={isAddFieldworkerModalOpen}
        onClose={() => setIsAddFieldworkerModalOpen(false)}
        ownerId={ownerId}
      />

      <ManageBalanceModal
        visible={isManageBalanceModalOpen}
        userId={ownerId}
        onClose={() => setIsManageBalanceModalOpen(false)}
      />

      {isAmcQuickAddOpen && !isAMCSection ? (
        <View
          style={{width: 0, height: 0, overflow: 'hidden'}}
          pointerEvents="none">
          <AMCDashboardScreen
            ownerId={ownerId}
            openAddAmcTrigger={addAmcTrigger}
            onAddAmcModalClose={() => setIsAmcQuickAddOpen(false)}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  container: {
    flex: 1,
    backgroundColor: THEME_PRIMARY,
  },
  containerHomeBackground: {
    backgroundColor: '#F2F3F5',
  },
  toolbar: {
    height: 48,
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  toolbarIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  toolbarTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  toolbarRightSpace: {
    width: 40,
  },
  toolbarRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerProfileBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
  },
  headerTextBlock: {
    flex: 1,
    marginLeft: 12,
  },
  headerBottomRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  headerName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtext: {
    marginTop: 3,
    fontSize: 13,
    color: 'rgba(255,255,255,0.84)',
  },
  headerFilterControl: {
    minWidth: 108,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 8,
    height: 34,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerMonthControl: {
    width: 128,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 8,
    height: 34,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerFilterLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  headerFilterArrow: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 8,
  },
  dashboardFilterBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 108 : 118,
    paddingRight: 16,
  },
  dashboardFilterPanel: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 6,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dashboardFilterItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dashboardFilterItemSelected: {
    backgroundColor: '#FCE9ED',
  },
  dashboardFilterItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dashboardFilterItemTextSelected: {
    color: THEME_PRIMARY,
  },
  headerLoaderRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLoaderText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  homeScrollView: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  taskContentContainer: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: THEME_PRIMARY,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  contentText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 20,
  },
  bottomBar: {
    height: 72,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 6,
    elevation: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabFabGap: {
    width: 64,
  },
  tabIcon: {
    color: '#6B7280',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
  tabLabel: {
    marginTop: 1,
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: THEME_PRIMARY,
  },
  fab: {
    position: 'absolute',
    bottom: 42,
    alignSelf: 'center',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: THEME_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '300',
  },
  taskHeader: {
    backgroundColor: THEME_PRIMARY,
  },
  taskToolbar: {
    height: 64,
    backgroundColor: '#D0003F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  taskToolbarMenu: {
    width: 38,
    height: 38,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  taskToolbarMenuText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
  taskToolbarTitle: {
    flex: 1,
    marginLeft: 26,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  taskToolbarActions: {
    width: 142,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskToolbarIcon: {
    width: 36,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  taskMonthRow: {
    height: 76,
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 46,
    paddingBottom: 18,
  },
  taskMonthText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  taskMonthArrow: {
    marginLeft: 14,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },
  employeeHeader: {
    height: 78,
    backgroundColor: '#D0003F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  employeeToolbarMenu: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  employeeToolbarMenuText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 32,
  },
  employeeToolbarTitle: {
    flex: 1,
    marginLeft: 22,
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  employeeToolbarActions: {
    width: 112,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employeeToolbarIcon: {
    width: 42,
    color: '#FFFFFF',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '800',
  },
  monthPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  monthPickerPanel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  monthPickerHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  monthPickerTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  monthPickerSubtitle: {
    marginTop: 6,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  monthPickerBody: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  monthPickerColumn: {
    flex: 1,
    minWidth: 0,
  },
  monthPickerColumnTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  monthPickerList: {
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  monthPickerItem: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  monthPickerItemSelected: {
    backgroundColor: 'rgba(195,0,47,0.12)',
  },
  monthPickerItemText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  monthPickerItemTextSelected: {
    color: THEME_PRIMARY,
    fontWeight: '800',
  },
  monthPickerFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  monthPickerButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthPickerButtonPrimary: {
    backgroundColor: THEME_PRIMARY,
  },
  monthPickerButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  monthPickerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
  },
  drawerPanel: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 24,
  },
  drawerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 6,
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3F4F6',
  },
  drawerName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  drawerContact: {
    marginTop: 4,
    fontSize: 13,
    color: '#4B5563',
  },
  drawerTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    alignSelf: 'flex-start',
  },
  drawerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  drawerItemLabel: {
    fontSize: 15,
    color: '#1F2937',
  },
  logoutButton: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#C62828',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  quickAddBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  quickAddPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  quickAddCloseButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 1,
    padding: 4,
  },
  quickAddCloseIcon: {
    color: THEME_PRIMARY,
    fontSize: 18,
    fontWeight: '700',
  },
  quickAddItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  quickAddItemIcon: {
    fontSize: 20,
    color: THEME_PRIMARY,
    width: 32,
  },
  quickAddItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
});

export default HomeActivityNewScreen;
