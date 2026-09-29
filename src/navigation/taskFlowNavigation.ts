// src/navigation/taskFlowNavigation.ts
//
// Java swaps task-flow fragments with transaction.replace() and no back stack, so
// the user can never navigate "back" into an earlier step (e.g. re-accept a task or
// re-submit a closure). React Navigation pushes by default, so the task flow uses
// these helpers to get the same behaviour.

import { StackActions } from '@react-navigation/native';

/**
 * Replaces the whole task flow with a single screen sitting directly on top of the
 * tab bar, i.e. stack = [TechnicianTabsRoot, <route>]. Back from `route` returns to
 * the tabs, never to a previous step of the flow. The existing tabs route (and its
 * state) is kept.
 */
export function resetToTabsThen(
  navigation: any,
  route: { name: string; params?: object },
) {
  const tabsRoute = navigation.getState().routes[0];
  navigation.reset({ index: 1, routes: [tabsRoute, route] });
}

/**
 * Ends the task flow: pops everything above the tab bar and shows Home. Java returns
 * to the dashboard after a task completes.
 */
export function finishTaskFlowToHome(navigation: any) {
  navigation.dispatch(StackActions.popToTop());
  navigation.navigate('TechnicianTabsRoot', { screen: 'Home' });
}
