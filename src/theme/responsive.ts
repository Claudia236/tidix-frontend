import { Platform, ViewStyle } from 'react-native';

// On web the app would otherwise stretch edge-to-edge on wide browser windows;
// cap it to a phone-like column so it doesn't look stretched/oversized.
export const WEB_MAX_WIDTH = 480;

export const webCentered: ViewStyle =
  Platform.OS === 'web'
    ? { width: '100%', maxWidth: WEB_MAX_WIDTH, alignSelf: 'center' }
    : {};
