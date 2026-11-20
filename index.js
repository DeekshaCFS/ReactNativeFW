/**
 * @format
 */
import './src/styles/iosElevation'
import { AppRegistry } from 'react-native';
import App from './App';
import trackingTick from './src/tracking/trackingHeadlessTask';
import { name as appName } from './app.json';
import './src/tracking/trackingEvents';

AppRegistry.registerComponent(appName, () => App);
// Tick source: TrackingForegroundService.kt sends these, name must match TrackingHeadlessService.TASK_NAME
AppRegistry.registerHeadlessTask('FWTrackingTick', () => trackingTick);