import { Platform } from "react-native";

const getApiUrl = () => {
    if (__DEV__) {
      if (Platform.OS === 'android') {
        return 'http://192.168.0.102:5555/';
      }
      if (Platform.OS === 'ios') {
        return 'http://localhost:5555/';
      }
    }
  };
  
  export const API_URL = getApiUrl();