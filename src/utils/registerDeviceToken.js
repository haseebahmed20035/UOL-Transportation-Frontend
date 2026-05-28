import messaging from '@react-native-firebase/messaging'
import { BASE_URL } from '../services/baseUrl'

export const registerDeviceToken = async ({
  role,
  userId,
  driverId,
}) => {
  try {
    console.log('🔥 REQUESTING NOTIFICATION PERMISSION')

    await messaging().requestPermission()

    const token = await messaging().getToken()

    console.log('🔥 FCM TOKEN:', token)

    const body =
      role === 'driver'
        ? {
            role: 'driver',
            driver_id: driverId || userId,
            token,
          }
        : {
            role: 'student',
            user_id: userId,
            token,
          }

    console.log('🔥 TOKEN SAVE BODY:', body)

    const response = await fetch(`${BASE_URL}/save-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    console.log('🔥 TOKEN SAVE RESPONSE:', data)

    return data
  } catch (error) {
    console.log('🔥 TOKEN ERROR:', error)
    return null
  }
}