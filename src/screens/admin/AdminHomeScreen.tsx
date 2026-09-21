// src/screens/admin/AdminHomeScreen.tsx

import React, { useEffect, useMemo, useState } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {getUserDetails} from '../../api/users/usersService';
import type {UserDetails, UserDetailsResultData} from '../../api/users/users.types';
import {getCountrySymbol} from '../../api/countryDetails/countryDetailsService';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import { HEADER_CONTENT_HEIGHT } from '../../components/AppHeader';
import { useDoubleBackExit } from '../../hooks/useDoubleBackExit';
import { ms, sp } from '../../utils/responsive';
import {
  getCurrentUserProfile,
  getCurrentPreferredLanguage,
  getCurrentUserId,
  setCurrentUserProfile,
  setCurrentCountryDetails,
} from '../../state/session';
import type {AdminTabParamList} from '../../navigation/AdminTabs';
import OwnerDashboardScreen, {type DayFilter} from './OwnerDashboardScreen';
import ItemInventoryTabHostScreen from './ItemInventoryTabHostScreen';
import PassbookExpenditureTabHostScreen from './PassbookExpenditureTabHostScreen';
import LeadListScreen from './LeadListScreen';
import AccountsScreen from './AccountsScreen';

// Drawer item labels now live in CustomDrawerContent.tsx (the shared,
// real Drawer). They still match these exact strings: 'Leads',
// 'Item Inventory', 'Passbook', 'AMC', 'Attendance', 'Accounts',
// 'Services', 'Help & Support' — see the `isXSection` checks below, which
// compare `selectedDrawerLabel` against them.
import AMCDashboardScreen from './AMCDashboardScreen';

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
const OwnerDashboard = OwnerDashboardScreen as React.ComponentType<{
  ownerId: number;
  filter: DayFilter;
  onCreateTask?: () => void;
  onEarningsPress?: () => void;
  onAmcStatusPress?: () => void;
  onAttendancePress?: () => void;
}>;

const DASHBOARD_FILTERS: DayFilter[] = ['Today', 'Week', 'Month', 'Year'];
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
}>;

const getUserDetailsResultData = (response: UserDetails) =>
  response?.ResultData ?? null;

const getSafeString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const getUserFieldString = (
  userDetails: UserDetailsResultData | null,
  key: keyof UserDetailsResultData,
) => getSafeString(userDetails?.[key]);

const getGreetingPrefix = (language: string) =>
  LANGUAGE_GREETINGS[language] ?? LANGUAGE_GREETINGS.English;

const buildFullName = (userDetails: UserDetailsResultData | null) => {
  const firstName = getUserFieldString(userDetails, 'FirstName');
  const lastName = getUserFieldString(userDetails, 'LastName');
  return [firstName, lastName].filter(Boolean).join(' ').trim();
};

const formatPrimaryContact = (userDetails: UserDetailsResultData | null) => {
  const contactNo = getUserFieldString(userDetails, 'ContactNo');
  if (contactNo) {
    return contactNo.startsWith('+') ? contactNo : `+91 ${contactNo}`;
  }

  return getUserFieldString(userDetails, 'Email') || 'No contact details';
};

type AdminHomeScreenProps = {
  onCreateTask?: () => void;
};

// NOTE: AdminTabs mounts this as `<AdminHomeScreen onCreateTask={...} />`,
// but this component previously took no props at all, so that handler was
// silently dropped -- the dashboard's "Create Task" button called nothing.
const AdminHomeScreen = ({ onCreateTask }: AdminHomeScreenProps) => {
  const navigation =
    useNavigation<BottomTabNavigationProp<AdminTabParamList, 'Home'>>();
  const insets = useSafeAreaInsets();
  // Params come from CustomDrawerContent, which deep-links straight into a
  // section of this screen the same way it deep-links technician's drawer
  // into a stack screen (see CustomDrawerContent.tsx).
  const route = useRoute<RouteProp<AdminTabParamList, 'Home'>>();
  // Set from the `addAmcTrigger` route param -- see the drawerSection effect
  // below. The FAB (now owned by AdminTabs, rendered above all four tabs)
  // sends this when "Add AMC" is tapped from any tab, the same way it sends
  // `addEnquiryTrigger` to the CRM tab.
  const [addAmcTrigger, setAddAmcTrigger] = useState(0);
  const [selectedDrawerLabel, setSelectedDrawerLabel] = useState('Dashboard');
  const [isUserDetailsLoading, setIsUserDetailsLoading] = useState(false);

  // The real Drawer (CustomDrawerContent) opens sections here via a
  // `drawerSection` param instead of local drawer-item taps.
  useEffect(() => {
    const section = route.params?.drawerSection;
    if (section) {
      setSelectedDrawerLabel(section);
      // Clear it so re-selecting the same drawer item still fires next time.
      navigation.setParams({ drawerSection: undefined });
    }
  }, [route.params?.drawerSection, navigation]);

  useEffect(() => {
    const trigger = route.params?.addAmcTrigger;
    if (trigger) {
      setAddAmcTrigger(trigger);
      navigation.setParams({ addAmcTrigger: undefined });
    }
  }, [route.params?.addAmcTrigger, navigation]);
  const [userDetails, setUserDetails] = useState<UserDetailsResultData | null>(() => {
    return getCurrentUserProfile().details;
  });
  const [useDefaultAvatar, setUseDefaultAvatar] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<DayFilter>('Today');
  const [isDashboardFilterOpen, setIsDashboardFilterOpen] = useState(false);

  const ownerId = getCurrentUserId();
  const preferredLanguage = useMemo(() => getCurrentPreferredLanguage(), []);

  const toolbarTitle = useMemo(
    () =>
      selectedDrawerLabel !== 'Dashboard' ? selectedDrawerLabel : 'FieldWeb',
    [selectedDrawerLabel],
  );

  // AppHeader itself is now rendered once by AdminTabs, above the tab bar,
  // instead of being drawn locally here — so the active section's title is
  // synced up via a route param for it to pick up (see AdminTabs' tabBar).
  useEffect(() => {
    navigation.setParams({ currentSectionTitle: toolbarTitle });
  }, [toolbarTitle, navigation]);

  const isItemInventorySection = selectedDrawerLabel === 'Item Inventory';
  const isPassbookSection = selectedDrawerLabel === 'Passbook';
  const isAMCSection = selectedDrawerLabel === 'AMC';
  const isLeadSection = selectedDrawerLabel === 'Leads';
  const isAccountsSection = selectedDrawerLabel === 'Accounts';
  const isHomeDashboard = selectedDrawerLabel === 'Dashboard';

  // Back from a drawer section (Leads, Accounts, AMC...) returns to the
  // dashboard first; only from the dashboard does back reach the exit prompt.
  useDoubleBackExit(() => {
    if (selectedDrawerLabel !== 'Dashboard') {
      setSelectedDrawerLabel('Dashboard');
      return true;
    }
    return false;
  });

  const isFieldWorkerUser = useMemo(() => {
    const roleDetails = userDetails as
      | (UserDetailsResultData & {
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

  const fullName = useMemo(() => {
    return buildFullName(userDetails) || 'User';
  }, [userDetails]);

  const firstName = useMemo(() => {
    return (
      getUserFieldString(userDetails, 'FirstName') || fullName
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

    return getUserFieldString(userDetails, 'Photo');
  }, [useDefaultAvatar, userDetails]);

  useEffect(() => {
    setUseDefaultAvatar(false);
  }, [profileImageUri]);

  useEffect(() => {
    let isMounted = true;

    const loadUserDetails = async () => {
      setIsUserDetailsLoading(true);

      try {
        const response = await getUserDetails({UserId: ownerId});
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

  // Java's HomeActivityNew.onCreate() fetches this once per session
  // alongside getUSerDetails() and caches it in SharedPrefManager
  // (CountryCode/CurrencySymbol) -- it's what CRMTaskDetailsFragmentNew /
  // TaskDetailsFragmentNew use to prefix the customer's phone number
  // ("+<code> <number>") and to build the wa.me link. Mirror that here so
  // every admin screen has it available via session getters.
  useEffect(() => {
    let isMounted = true;

    const loadCountrySymbol = async () => {
      try {
        const response = await getCountrySymbol({UserId: ownerId});
        const resultData = response?.ResultData;
        if (!isMounted || !resultData) {
          return;
        }

        setCurrentCountryDetails(resultData.CountryCode, resultData.CurrencySymbol);
      } catch {
        // Non-critical: phone/currency formatting just falls back to raw
        // values if this fails, same as the rest of this bootstrap effect.
      }
    };

    loadCountrySymbol();

    return () => {
      isMounted = false;
    };
  }, [ownerId]);

  // Drawer content, logout confirmation, and check-out flow now all live in
  // the shared CustomDrawerContent (navigation/CustomDrawerContent.tsx) —
  // the same real Drawer the technician screens use. This screen just opens
  // it (opens via the hamburger button on the shared AppHeader) and reacts
  // to `drawerSection` params.

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
      return <LeadList userId={ownerId} />;
    }

    if (isAccountsSection) {
      return <AccountsScreen ownerId={ownerId} />;
    }

    if (isAMCSection) {
      return (
        <AMCDashboardScreen
          ownerId={ownerId}
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

    return (
      <OwnerDashboard
        ownerId={ownerId}
        filter={dashboardFilter}
        onCreateTask={onCreateTask}
        // Matches Java's Earnings tap -> HomePassbookFragmentNew: jump to
        // the Passbook section of this same screen.
        onEarningsPress={() => setSelectedDrawerLabel('Passbook')}
        // Matches Java's AMC Status tap -> AMCListFragment.
        onAmcStatusPress={() => setSelectedDrawerLabel('AMC')}
        // Matches Java's Attendance tap -> LeaveTabHost / PersonalLeaveTabHost
        // (role-based in Java; the RN port already unifies both into a single
        // Leave tab inside Employee Management, so we route there for every
        // role). This is a cross-tab jump, not a drawerSection switch, since
        // Leave lives on the Employee tab, not inside this Home tab.
        onAttendancePress={() =>
          navigation.navigate('Employee', { openLeaveTabTrigger: Date.now() })
        }
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + HEADER_CONTENT_HEIGHT },
        isHomeDashboard ? styles.containerHomeBackground : null,
      ]}
    >
      {/* The hamburger/title/notification toolbar used to be drawn here (in
          two slightly different variants); it's now the shared AppHeader
          rendered once by AdminTabs above the tab bar — this screen just
          keeps its own greeting/filter content below it. Sections that draw
          their own screen (Item Inventory, Passbook, Leads, AMC, Accounts)
          show no extra header content at all now. */}
      {isAMCSection ||
      isLeadSection ||
      isAccountsSection ||
      isItemInventorySection ||
      isPassbookSection ? null : (
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
              <Ionicons name="chevron-down" style={styles.headerFilterArrow} />
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
      )}

      {isItemInventorySection ||
      isPassbookSection ||
      isLeadSection ||
      isAccountsSection ||
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
      {/* Drawer itself is now the real navigation Drawer (CustomDrawerContent),
          opened via the hamburger button on the shared AppHeader (rendered
          by AdminTabs) — same component, same open/close animation, as
          technician screens. */}

      {/* The quick-add FAB, its bottom sheet, and the five simple modals
          (AddTask/AddItem/AssignItem/AddFieldworker/ManageBalance) moved to
          AdminTabs so they're available from all four tabs, not just Home.
          "Add AMC" now navigates here with drawerSection: 'AMC' +
          addAmcTrigger (see the effect above) instead of the old hidden
          off-screen AMCDashboardScreen mount -- pressing it now takes you to
          the real AMC section instead of opening an invisible overlay from
          wherever you were. Flagging this as an intentional UX change. */}
    </View>
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
    height: ms(48),
    backgroundColor: THEME_PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ms(8),
  },
  toolbarIconButton: {
    width: ms(40),
    height: ms(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarTitle: {
    color: '#FFFFFF',
    fontSize: sp(17),
    fontWeight: '700',
  },
  toolbarRightSpace: {
    width: ms(40),
  },
  toolbarRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    backgroundColor: THEME_PRIMARY,
    paddingHorizontal: ms(16),
    paddingTop: Platform.OS === 'ios' ? ms(10) : ms(14),
    paddingBottom: ms(12),
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(12),
  },
  headerName: {
    flexShrink: 1,
    fontSize: sp(18),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerFilterControl: {
    minWidth: ms(108),
    height: ms(34),
    paddingHorizontal: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerFilterLabel: {
    color: '#FFFFFF',
    fontSize: sp(16),
    fontWeight: '500',
  },
  headerFilterArrow: {
    color: '#FFFFFF',
    fontSize: sp(16),
    marginLeft: ms(8),
  },
  dashboardFilterBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? ms(108) : ms(118),
    paddingRight: ms(16),
  },
  dashboardFilterPanel: {
    width: ms(140),
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    paddingVertical: ms(6),
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: ms(8),
    shadowOffset: { width: 0, height: ms(4) },
  },
  dashboardFilterItem: {
    paddingVertical: ms(10),
    paddingHorizontal: ms(16),
  },
  dashboardFilterItemSelected: {
    backgroundColor: '#FCE9ED',
  },
  dashboardFilterItemText: {
    fontSize: sp(14),
    fontWeight: '600',
    color: '#111827',
  },
  dashboardFilterItemTextSelected: {
    color: THEME_PRIMARY,
  },
  headerLoaderRow: {
    marginTop: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLoaderText: {
    marginLeft: ms(8),
    color: '#FFFFFF',
    fontSize: sp(12),
  },
  homeScrollView: {
    flex: 1,
    backgroundColor: '#F2F3F5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: ms(16),
    paddingBottom: ms(100),
  },
  taskContentContainer: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: THEME_PRIMARY,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: ms(12),
    padding: ms(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentTitle: {
    fontSize: sp(18),
    fontWeight: '700',
    color: '#111827',
  },
  contentText: {
    fontSize: sp(14),
    color: '#4B5563',
    marginTop: ms(8),
    lineHeight: sp(20),
  },
});

export default AdminHomeScreen;