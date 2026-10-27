// src/navigation/taskFlowNavigation.ts
//
// Java swaps task-flow fragments with transaction.replace() and no back stack, so
// the user can never navigate "back" into an earlier step (e.g. re-accept a task or
// re-submit a closure). The task-flow screens are tab-navigator screens (see
// TechnicianTabs) that unmount when blurred and whose back button always returns
// to Home, which gives the same behaviour; these helpers keep the call sites
// readable.

import { StackActions } from '@react-navigation/native';

/**
 * Moves to the next task-flow step. The previous step unmounts (unmountOnBlur), and
 * back from `route` returns to Home, never to a previous step of the flow.
 *
 * DocumentUpload is a stack-level bottom sheet over the tabs; Home is shown behind
 * it (as before) rather than the finished step.
 */
export function resetToTabsThen(
  navigation: any,
  route: { name: string; params?: object },
) {
  if (route.name === 'DocumentUpload') {
    navigation.navigate('Home');
  }
  navigation.navigate(route.name, route.params);
}

/**
 * Ends the task flow: closes the Upload Documents sheet (stack) and shows Home.
 * Java returns to the dashboard after a task completes.
 */
export function finishTaskFlowToHome(navigation: any) {
  navigation.dispatch(StackActions.popToTop());
  navigation.navigate('TechnicianTabsRoot', { screen: 'Home' });
}
