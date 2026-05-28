import messaging from '@react-native-firebase/messaging';
import { BASE_URL} from '../services/baseUrl'
export { registerDeviceToken } from '../utils/registerDeviceToken'
export const registerDeviceToken =
  async (userId) => {

    try {

      console.log('🔥 REQUESTING PERMISSION');

      await messaging().requestPermission();

      const token =
        await messaging().getToken();

      console.log('🔥 FCM TOKEN:', token);

      console.log('🔥 SAVING TOKEN');

      await fetch(
        `${BASE_URL}/save-push-token`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            user_id: userId,
            token: token,
          }),
        }
      );

      console.log('🔥 TOKEN SAVED');

    } catch (error) {

      console.log(
        '🔥 TOKEN ERROR:',
        error
      );
    }
};