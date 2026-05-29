import { Alert } from 'react-native';

// Register global exception handler FIRST before any other modules are imported
if (global.ErrorUtils) {
  const defaultHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('Captured global unhandled error:', error);
    Alert.alert(
      "App Startup Exception",
      `${error?.message || error}\n\n${error?.stack || ''}`,
      [{ text: "OK" }]
    );
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// Now register the root component using Expo
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
