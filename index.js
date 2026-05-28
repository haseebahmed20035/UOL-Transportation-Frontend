/**
 * @format
 */
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import messaging from '@react-native-firebase/messaging'
import notifee, { AndroidImportance } from '@notifee/react-native'
import App from './App'
import { name as appName } from './app.json'

const CHANNEL_ID = 'uol_transport_alerts'

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔥 BACKGROUND PUSH:', remoteMessage)

  // If backend sends notification payload, Android normally shows it automatically.
  // This block is mainly for data-only messages, to avoid duplicate notifications.
  if (remoteMessage?.notification) {
    return
  }

  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'UOL Transport Alerts',
    importance: AndroidImportance.HIGH,
    vibration: true,
  })

  await notifee.displayNotification({
    title: remoteMessage?.data?.title || 'UOL Transport',
    body: remoteMessage?.data?.body || 'You have a new notification.',
    android: {
      channelId: CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
      },
    },
  })
})

AppRegistry.registerComponent(appName, () => App)