// src/navigation/TechnicianTabs.tsx

import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AppHeader from '../components/AppHeader';
import BottomTabBar from '../components/BottomTabBar';

import HomeScreen from '../screens/technician/main/HomeScreen';
import TaskScreen from '../screens/technician/main/TaskScreen';
import AttendanceScreen from '../screens/technician/main/AttendanceScreen';
import PassbookScreen from '../screens/technician/main/PassbookScreen';

export type TechnicianTabParamList = {
  Home: undefined;
  Task: undefined;
  Attendance: undefined;
  Passbook: undefined;
};

const Tab = createBottomTabNavigator<TechnicianTabParamList>();

export default function TechnicianTabs() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => {
          const currentRoute =
            props.state.routes[props.state.index].name;

          // const hideTabBar =
          //   currentRoute === 'help' ||
          //   currentRoute === 'helpMessages' ||
          //   currentRoute === 'Settings' ||
          //   currentRoute === 'FieldWeb AI' ||
          //   currentRoute === 'PrivacyPolicy' ||
          //   currentRoute === 'RefundPolicy';

          return (
            <>
              <AppHeader
                title={getTitle(currentRoute)}
                navigation={props.navigation as any}
              />

              {/* {!hideTabBar && <BottomTabBar {...props} />} */}
              <BottomTabBar {...props} />
            </>
          );
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Task" component={TaskScreen} />
        <Tab.Screen name="Attendance" component={AttendanceScreen} />
        <Tab.Screen name="Passbook" component={PassbookScreen} />
      </Tab.Navigator>
    </View>
  );
}

//  function getTitle(state: any) {
//   const routeName = state.routes[state.index].name;

function getTitle(routeName: string) {
  switch (routeName) {
    case 'Home':
      return 'FieldWeb';
    case 'Task':
      return 'Tasks';
    case 'Attendance':
      return 'Attendance';
    case 'Passbook':
      return 'Passbook';
    default:
      return 'FieldWeb';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});