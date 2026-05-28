import messaging from '@react-native-firebase/messaging'
import notifee, { AndroidImportance } from '@notifee/react-native'

export const NOTIFICATION_CHANNEL_ID = 'uol_transport_alerts'

export const setupNotifications = async () => {
  try {
    await notifee.requestPermission()

    await notifee.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'UOL Transport Alerts',
      importance: AndroidImportance.HIGH,
      vibration: true,
    })

    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('🔥 FOREGROUND PUSH:', remoteMessage)

      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'UOL Transport'

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You have a new notification.'

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: NOTIFICATION_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
      })
    })

    return unsubscribe
  } catch (error) {
    console.log('Notification setup error:', error)
    return null
  }
}