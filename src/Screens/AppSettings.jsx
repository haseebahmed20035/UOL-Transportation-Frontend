import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import messaging from '@react-native-firebase/messaging'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'

const AppSettings = ({ navigation }) => {
  const { theme, toggleTheme, reloadTheme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()

  const [role, setRole] = useState('student')
  const [userData, setUserData] = useState(null)
  const [notifications, setNotifications] = useState(true)
  const [notificationLoading, setNotificationLoading] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const getNotificationKey = userRole => {
    return `${userRole}_notifications`
  }

  const loadSettings = async () => {
    try {
      const userString = await AsyncStorage.getItem('user')
      const user = userString ? JSON.parse(userString) : null

      const userRole = user?.role || 'student'

      setUserData(user)
      setRole(userRole)

      const savedNotification = await AsyncStorage.getItem(
        getNotificationKey(userRole),
      )

      if (savedNotification !== null) {
        setNotifications(JSON.parse(savedNotification))
      } else {
        setNotifications(false)
      }
    } catch (error) {
      console.log('Load settings error:', error)
    }
  }

  const requestNotificationPermission = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        )

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return false
        }
      }

      const authStatus = await messaging().requestPermission()

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL

      return enabled
    } catch (error) {
      console.log('Notification permission error:', error)
      return false
    }
  }

  const getUserPayloadForToken = token => {
    const finalRole = userData?.role || role

    if (finalRole === 'driver') {
      const driverId =
        userData?.driver_id || userData?.driverId || userData?.id || null

      return {
        role: 'driver',
        driver_id: driverId,
        token,
      }
    }

    const userId = userData?.user_id || userData?.userId || userData?.id || null

    return {
      role: finalRole,
      user_id: userId,
      token,
    }
  }

  const savePushTokenToBackend = async token => {
    const payload = getUserPayloadForToken(token)

    if (!payload.token) {
      throw new Error('FCM token not found')
    }

    if (payload.role === 'driver' && !payload.driver_id) {
      throw new Error('Driver ID not found')
    }

    if (payload.role !== 'driver' && !payload.user_id) {
      throw new Error('User ID not found')
    }

    const response = await fetch(`${BASE_URL}/save-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = await response.json()

    if (!json?.success) {
      throw new Error(json?.message || 'Unable to save push token')
    }

    return json
  }

  const removePushTokenFromBackend = async () => {
    const finalRole = userData?.role || role

    const payload =
      finalRole === 'driver'
        ? {
            role: 'driver',
            driver_id:
              userData?.driver_id || userData?.driverId || userData?.id || null,
          }
        : {
            role: finalRole,
            user_id: userData?.user_id || userData?.userId || userData?.id || null,
          }

    const response = await fetch(`${BASE_URL}/remove-push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const json = await response.json()

    if (!json?.success) {
      throw new Error(json?.message || 'Unable to remove push token')
    }

    return json
  }

  const enableNotifications = async () => {
    const hasPermission = await requestNotificationPermission()

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Please allow notification permission from mobile settings.',
      )
      return false
    }

    const token = await messaging().getToken()

    if (!token) {
      Alert.alert('Error', 'Unable to get notification token.')
      return false
    }

    await savePushTokenToBackend(token)

    await AsyncStorage.setItem(getNotificationKey(role), JSON.stringify(true))
    await AsyncStorage.setItem(`${role}_fcm_token`, token)

    setNotifications(true)

    Alert.alert('Enabled', 'Notifications have been enabled.')

    return true
  }

  const disableNotifications = async () => {
    await removePushTokenFromBackend()

    await AsyncStorage.setItem(getNotificationKey(role), JSON.stringify(false))
    await AsyncStorage.removeItem(`${role}_fcm_token`)

    setNotifications(false)

    Alert.alert('Disabled', 'Notifications have been disabled.')
  }

  const toggleNotifications = async () => {
    if (notificationLoading) return

    try {
      setNotificationLoading(true)

      if (notifications) {
        await disableNotifications()
      } else {
        await enableNotifications()
      }
    } catch (error) {
      console.log('Toggle notification error:', error)
      Alert.alert(
        'Notification Error',
        error?.message || 'Unable to update notification settings.',
      )
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleThemeToggle = async () => {
    await toggleTheme()

    if (reloadTheme) {
      await reloadTheme()
    }
  }

  const clearRecentActivities = async () => {
    try {
      await AsyncStorage.removeItem(`${role}_recentScreens`)
      await AsyncStorage.removeItem('recentScreens')

      Alert.alert('Cleared', 'Recent activities removed.')
    } catch (error) {
      console.log('Clear recent activities error:', error)
    }
  }

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: () => navigation.replace('Login'),
      },
    ])
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={24} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.headerText }]}>
          {role.charAt(0).toUpperCase() + role.slice(1)} Settings
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 15,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View
          style={[
            styles.roleCard,
            {
              backgroundColor: theme.colors.dashboard,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.roleIconBox,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon
              name={
                role === 'admin'
                  ? 'shield-checkmark-outline'
                  : role === 'driver'
                  ? 'bus-outline'
                  : 'school-outline'
              }
              size={24}
              color={theme.colors.background}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.roleTitle, { color: theme.colors.text }]}>
              {role.charAt(0).toUpperCase() + role.slice(1)} Preferences
            </Text>

            <Text style={[styles.roleSubtitle, { color: theme.colors.icon }]}>
              These settings will apply only to this account role.
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>

        <View
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.option,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name='moon-outline' size={22} color={theme.colors.icon} />
              <View>
                <Text style={[styles.rowText, { color: theme.colors.text }]}>
                  Dark Mode
                </Text>

                <Text style={[styles.rowSubText, { color: theme.colors.icon }]}>
                  Separate for {role}
                </Text>
              </View>
            </View>

            <Switch value={theme.darkMode} onValueChange={handleThemeToggle} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>

        <View
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.option,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon
                name='notifications-outline'
                size={22}
                color={theme.colors.icon}
              />
              <View>
                <Text style={[styles.rowText, { color: theme.colors.text }]}>
                  Enable Notifications
                </Text>

                <Text style={[styles.rowSubText, { color: theme.colors.icon }]}>
                  Save FCM token for this role
                </Text>
              </View>
            </View>

            {notificationLoading ? (
              <ActivityIndicator size='small' color={theme.colors.primary} />
            ) : (
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
              />
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          App Data
        </Text>

        <View
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.option,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.row} onPress={clearRecentActivities}>
            <View style={styles.rowLeft}>
              <Icon name='trash-outline' size={22} color={theme.colors.icon} />
              <View>
                <Text style={[styles.rowText, { color: theme.colors.text }]}>
                  Clear Recent Activities
                </Text>

                <Text style={[styles.rowSubText, { color: theme.colors.icon }]}>
                  Clears saved activity history
                </Text>
              </View>
            </View>

            <Icon name='chevron-forward' size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About
        </Text>

        <View
          style={[
            styles.option,
            {
              backgroundColor: theme.colors.option,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon
                name='information-circle-outline'
                size={22}
                color={theme.colors.icon}
              />

              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                Version
              </Text>
            </View>

            <Text style={{ color: theme.colors.text }}>1.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Icon name='log-out-outline' size={20} color='white' />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

export default AppSettings

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },

  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  roleSubtitle: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '600',
  },

  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 22,
    fontSize: 16,
  },

  option: {
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  rowText: {
    fontSize: 15,
    fontWeight: '700',
  },

  rowSubText: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },

  logoutBtn: {
    marginTop: 40,
    backgroundColor: '#d9534f',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  logoutText: {
    color: 'white',
    fontWeight: 'bold',
  },
})