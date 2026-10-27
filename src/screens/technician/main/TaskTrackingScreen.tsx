// src/screens/technician/main/TaskTrackingScreen.tsx
//
// Hosts the Java accept / reject / resume dialog (TaskTrackingSheet) for the entry points
// that still navigate here (notification, late-reject, deep links). Home and the Task tab
// open the same dialog in place over their own list, like Java.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TechnicianStackParamList } from '../../../navigation/TechStack';
import TaskTrackingSheet from '../../../components/TaskTrackingSheet';

type Props = NativeStackScreenProps<TechnicianStackParamList, 'TaskTracking'>;

export default function TaskTrackingScreen({ navigation, route }: Props) {
  const { task, autoReject = false, resumeOnHold = false } = route.params;

  return (
    <View style={styles.root}>
      <TaskTrackingSheet
        task={task}
        autoReject={autoReject}
        resumeOnHold={resumeOnHold}
        navigation={navigation}
        onClose={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
});
