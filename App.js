import React, { useState, useEffect, Component } from 'react';
import {
  AppState,
  AsyncStorage,
  Platform,
  StatusBar,
  TouchableHighlight,
  UIManager,
} from 'react-native';
import { Constants } from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import * as Amplitude from 'expo-analytics-amplitude';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Entypo } from '@expo/vector-icons';
import resources from './resources';
import keys from './constants/Keys';
import AppNavigator from './navigation/AppNavigator';
import Storybook from './storybook';
import OneSignal from 'react-native-onesignal';

Amplitude.initialize(keys.AMPLITUDE);

const channel = Constants?.manifest?.releaseChannel;
const emptyStorage = () =>
  AsyncStorage.multiRemove(['@posts', '@media', '@groups', '@missions']);

// override amplitude tracking
if (!channel) {
  Amplitude.logEvent = (name) => console.log(`[amplitude]: ${name}`);
  Amplitude.logEventWithProperties = (name, data) =>
    console.log(`[amplitude]: ${name}\n`, data);
  emptyStorage();
} else if (channel.indexOf('develop') !== -1) {
  // beta testing from the store--we want to log this to amplitude, but
  //  separate it out
  Amplitude.logEvent = (name) => {
    name = `BETA ${name}`;
    console.log(`[amplitude]: ${name}`);
    Amplitude.logEvent(name);
  };
  Amplitude.logEventWithProperties = (name, data) => {
    name = `BETA ${name}`;
    console.log(`[amplitude]: ${name}\n`, data);
    Amplitude.logEventWithProperties(name, data);
  };
  emptyStorage();
}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function myiOSPromptCallback(permission) {
  // do something with permission value
}

function onReceived(notification) {
  console.log('Notification received: ', notification);
}

function onOpened(openResult) {
  console.log('Message: ', openResult.notification.payload.body);
  console.log('Data: ', openResult.notification.payload.additionalData);
  console.log('isActive: ', openResult.notification.isAppInFocus);
  console.log('openResult: ', openResult);
}

function onIds(device) {
  console.log('Device info: ', device);
}

function App() {
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const [showStorybook, setShowStorybook] = useState(false);

  // Remove this method to stop OneSignal Debugging
  OneSignal.setLogLevel(6, 0);

  // Replace 'YOUR_ONESIGNAL_APP_ID' with your OneSignal App ID.
  OneSignal.init(keys.ONESIGNAL_APP_ID, {
    kOSSettingsKeyAutoPrompt: false,
    kOSSettingsKeyInAppLaunchURL: false,
    kOSSettingsKeyInFocusDisplayOption: 2,
  });
  OneSignal.inFocusDisplaying(2); // Controls what should happen if a notification is received while the app is open. 2 means that the notification will go directly to the device's notification center.

  // The promptForPushNotifications function code will show the iOS push notification prompt. We recommend removing the following code and instead using an In-App Message to prompt for notification permission (See step below)
  OneSignal.promptForPushNotificationsWithUserResponse(myiOSPromptCallback);

  // componentWillUnmount() {
  //   OneSignal.removeEventListener('received', this.onReceived);
  //   OneSignal.removeEventListener('opened', this.onOpened);
  //   OneSignal.removeEventListener('ids', this.onIds);
  // }
  useEffect(() => {
    console.log('Mounting...');
    OneSignal.addEventListener('received', onReceived);
    OneSignal.addEventListener('opened', onOpened);
    OneSignal.addEventListener('ids', onIds);
    return () => {
      // componentWillUnmount()
      OneSignal.removeEventListener('received', onReceived);
      OneSignal.removeEventListener('opened', onOpened);
      OneSignal.removeEventListener('ids', onIds);
      console.log('Un-Mounting!!!');
    };
  }, []);

  /**
   * Log when our app
   * becomes active (The app is running in the foreground)
   * or runs in the background (The user is either: in another app, on the home screen,
   * or [Android-only] on another Activity, even if it was launched by the app)
   * https://reactnative.dev/docs/appstate
   */
  useEffect(() => {
    const loadResourcesAsync = async () => {
      return Promise.all(resources).then(() => {
        setIsLoadingComplete(true);
      });
    };

    SplashScreen.preventAutoHideAsync().catch((err) => console.warn(err));
    loadResourcesAsync().then(() => {
      setIsLoadingComplete(true);
      SplashScreen.hideAsync();
    });

    const handleAppStateChange = (state) => {
      if (state === 'active') {
        Amplitude.logEvent('Start session');
      }
      if (state === 'background') {
        Amplitude.logEvent('End session');
      }
    };

    AppState.addEventListener('change', handleAppStateChange);

    return () => AppState.removeEventListener('change', handleAppStateChange);
  }, []);

  if (!isLoadingComplete) {
    return null;
  }

  if (__DEV__ && showStorybook) {
    return <Storybook />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        hidden={true}
        animated
        barStyle="light-content"
        networkActivityIndicatorVisible
        showHideTransition="fade"
        translucent
      />
      <AppNavigator />

      {/* Button to show the Storybook 📖 */}
      {__DEV__ && (
        <TouchableHighlight
          underlayColor="#ce2f1c"
          onPress={() => setShowStorybook(true)}
          // eslint-disable-next-line
          style={{
            width: 50,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            bottom: 100,
            right: 20,
            borderRadius: 25,
            backgroundColor: '#1f6276',
          }}
        >
          <Entypo
            name={'book'}
            size={30}
            color="#fff"
            // eslint-disable-next-line
            style={{ marginTop: 4 }}
          />
        </TouchableHighlight>
      )}
    </SafeAreaProvider>
  );
}

export default App;
