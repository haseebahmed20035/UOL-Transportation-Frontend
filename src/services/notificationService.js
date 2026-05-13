import messaging from '@react-native-firebase/messaging';

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
        'http://192.168.100.100:5000/save-push-token',
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