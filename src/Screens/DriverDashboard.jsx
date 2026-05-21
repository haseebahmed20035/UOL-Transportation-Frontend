import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL, endPoints } from '../services/baseUrl'
import { useFocusEffect } from '@react-navigation/native'
import axios from 'axios'

const DriverDashboard = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const [menuVisible, setMenuVisible] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [recentScreens, setRecentScreens] = useState([])
  const [rideLoading, setRideLoading] = useState(false)
  const [currentRide, setCurrentRide] = useState(null)
  const [notifications, setNotifications] = useState([])

  const unreadNotificationCount = notifications.filter(
    item => Number(item.is_read) === 0,
  ).length

  const fetchDriverNotifications = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      const rawDriverId =
        parsedUser?.driver_id ||
        parsedUser?.driverId ||
        parsedUser?.id ||
        parsedUser?.user_id ||
        parsedUser?.userId

      if (!rawDriverId) {
        setNotifications([])
        return
      }

      const driverNotificationUserId = `driver_${rawDriverId}`

      const response = await axios.get(
        `${BASE_URL}/${endPoints.getUserNotifications}/${driverNotificationUserId}`,
      )

      const list = response.data?.notifications || []

      setNotifications(list)
    } catch (error) {
      console.log(
        'Driver dashboard notification error:',
        error?.response?.data || error,
      )

      setNotifications([])
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchDriverNotifications()
    }, []),
  )
  useEffect(() => {
    loadRecent()

    fetchCurrentRideStatus()
    fetchDriverNotifications()

    const unsubscribe = navigation.addListener('focus', () => {
      fetchCurrentRideStatus()
      fetchDriverNotifications()
    })

    const interval = setInterval(() => {
      fetchCurrentRideStatus()
    }, 8000)

    const notificationInterval = setInterval(() => {
      fetchDriverNotifications()
    }, 10000)

    return () => {
      unsubscribe()
      clearInterval(interval)
      clearInterval(notificationInterval)
    }
  }, [navigation])

  const fetchCurrentRideStatus = async () => {
    try {
      setRideLoading(true)

      const storedUser = await AsyncStorage.getItem('user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      const activeTripString = await AsyncStorage.getItem('activeTrip')
      const activeTrip = activeTripString ? JSON.parse(activeTripString) : null

      const driverId =
        parsedUser?.driver_id ||
        parsedUser?.id ||
        parsedUser?.user_id ||
        parsedUser?.userId

      if (!driverId) {
        setCurrentRide(null)
        return
      }

      let backendRide = null

      try {
        const response = await fetch(
          `${BASE_URL}/driver/current-ride/${driverId}`,
        )

        const data = await response.json()

        if (response.ok && data?.success && data?.ride) {
          backendRide = data.ride
        }
      } catch (apiError) {
        console.log('Current ride API error:', apiError)
      }

      if (backendRide) {
        setCurrentRide({
          ...backendRide,
          is_live: true,
        })
        return
      }

      if (activeTrip) {
        setCurrentRide({
          ...activeTrip,
          is_live: true,
          status: 'running',
        })
        return
      }

      setCurrentRide(null)
    } catch (error) {
      console.log('Current ride status error:', error)
      setCurrentRide(null)
    } finally {
      setRideLoading(false)
    }
  }

  const loadRecent = async () => {
    const stored = await AsyncStorage.getItem('recentScreens')

    if (stored) {
      setRecentScreens(JSON.parse(stored))
    }
  }

  const navigateAndTrack = async screen => {
    const time = new Date().toLocaleTimeString()

    const updated = [
      {
        name: screen,
        time,
      },
      ...recentScreens.filter(s => s.name !== screen),
    ].slice(0, 5)

    setRecentScreens(updated)

    await AsyncStorage.setItem('recentScreens', JSON.stringify(updated))

    navigation.navigate(screen)
  }

  const menuAnimation = () => {
    setMenuVisible(!menuVisible)

    Animated.timing(fadeAnim, {
      toValue: menuVisible ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }

  const actionCards = [
    {
      title: 'Trip Control',
      icon: 'play-circle',
      color: '#4CAF50',
      screen: 'TripControl',
    },

    {
      title: 'My Route',
      icon: 'map',
      color: '#FF9800',
      screen: 'DriverMyRoute',
    },

    {
      title: 'Notifications',
      icon: 'notifications',
      color: '#009688',
      screen: 'DriverNotification',
    },
  ]

  const isRideActive =
    currentRide?.is_live === true ||
    currentRide?.is_live === 1 ||
    currentRide?.ride_active === true ||
    currentRide?.ride_active === 1 ||
    currentRide?.status === 'live' ||
    currentRide?.status === 'active' ||
    currentRide?.status === 'running'
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: '#f5f7fb',
        },
      ]}
    >
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle='light-content'
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image source={require('../Images/uol.png')} style={styles.logo} />

          <View>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>

            <Text style={styles.headerSub}>UOL Transportation</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DriverNotification')}
          >
            <Icon name='notifications-outline' size={24} color='white' />

            {unreadNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 99
                    ? '99+'
                    : unreadNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileBtn} onPress={menuAnimation}>
            <Text style={styles.profileText}>D</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DROPDOWN */}
      {menuVisible && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: fadeAnim,
                },
              ],
            },
          ]}
        >
          <View style={styles.profileTop}>
            <View style={styles.profileCircle}>
              <Text style={styles.profileCircleText}>D</Text>
            </View>

            <Text style={styles.driverName}>Driver</Text>

            <Text style={styles.driverRole}>Transport Staff</Text>
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateAndTrack('DriverPersonalInfo')}
          >
            <Icon name='person-outline' size={20} color='#175812' />

            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateAndTrack('AppSettings')}
          >
            <Icon name='settings-outline' size={20} color='#175812' />

            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateAndTrack('Help')}
          >
            <Icon name='help-circle-outline' size={20} color='#175812' />

            <Text style={styles.menuText}>Help Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              Alert.alert('Logout', 'Are you sure?', [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },

                {
                  text: 'Logout',

                  onPress: () => navigation.replace('Login'),
                },
              ])
            }}
          >
            <Icon name='log-out-outline' size={20} color='white' />

            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* WELCOME CARD */}
        <View style={styles.welcomeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Welcome Driver 👋</Text>

            <Text style={styles.welcomeSubtitle}>
              Manage rides, students, attendance and live tracking efficiently.
            </Text>

            <View
              style={[
                styles.activeRideChip,
                {
                  backgroundColor: isRideActive
                    ? 'rgba(76,175,80,0.22)'
                    : 'rgba(255,255,255,0.15)',
                },
              ]}
            >
              <Icon
                name={isRideActive ? 'radio-button-on' : 'radio-button-off'}
                size={12}
                color={isRideActive ? '#4CAF50' : '#ddd'}
              />

              <Text style={styles.activeRideText}>
                {rideLoading
                  ? 'Checking Ride...'
                  : isRideActive
                  ? 'Ride Active'
                  : 'No Active Ride'}
              </Text>
            </View>
          </View>

          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/512/1995/1995574.png',
            }}
            style={styles.driverImage}
          />
        </View>

        {/* LIVE STATUS */}
        <View style={styles.liveCard}>
          <View style={styles.liveTop}>
            <View>
              <Text style={styles.liveTitle}>Current Ride Status</Text>

              <Text style={styles.liveSub}>
                {rideLoading
                  ? 'Checking bus status...'
                  : isRideActive
                  ? `Bus #${currentRide?.bus_number || 'N/A'}`
                  : 'No bus is live right now'}
              </Text>
            </View>

            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: isRideActive ? '#4CAF50' : '#9E9E9E',
                },
              ]}
            >
              <Text style={styles.liveBadgeText}>
                {rideLoading ? '...' : isRideActive ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {rideLoading ? (
            <View style={styles.emptyRideBox}>
              <Text style={styles.emptyRideText}>
                Fetching current ride status...
              </Text>
            </View>
          ) : isRideActive ? (
            <View style={styles.liveRow}>
              <View style={styles.liveItem}>
                <Icon name='location' size={22} color='#2196F3' />

                <Text style={styles.liveItemTitle}>Current Stop</Text>

                <Text style={styles.liveItemValue}>
                  {currentRide?.current_stop ||
                    currentRide?.stop_name ||
                    currentRide?.last_location_name ||
                    'Updating...'}
                </Text>
              </View>

              <View style={styles.liveItem}>
                <Icon name='time' size={22} color='#FF9800' />

                <Text style={styles.liveItemTitle}>ETA</Text>

                <Text style={styles.liveItemValue}>
                  {currentRide?.eta
                    ? `${currentRide.eta} mins`
                    : 'Calculating...'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyRideBox}>
              <Icon name='bus-outline' size={34} color='#9E9E9E' />

              <Text style={styles.emptyRideTitle}>No Active Ride</Text>

              <Text style={styles.emptyRideText}>
                Start a ride from Trip Control to make the bus live for
                students.
              </Text>
            </View>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.grid}>
          {actionCards.map(item => (
            <TouchableOpacity
              key={item.title}
              style={styles.actionCard}
              onPress={() => navigateAndTrack(item.screen)}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              >
                <Icon name={item.icon} size={28} color='white' />
              </View>

              {item.title === 'Notifications' && unreadNotificationCount > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {unreadNotificationCount > 99
                      ? '99+'
                      : unreadNotificationCount}
                  </Text>
                </View>
              )}

              <Text style={styles.actionTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* RECENT */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
        </View>

        <View style={styles.recentCard}>
          {recentScreens.length === 0 ? (
            <Text style={styles.noRecentText}>No recent activities</Text>
          ) : (
            recentScreens.map((item, index) => (
              <View key={index} style={styles.recentItem}>
                <Icon name='time-outline' size={18} color='#175812' />

                <View>
                  <Text style={styles.recentText}>{item.name}</Text>

                  <Text
                    style={{
                      color: '#777',
                      fontSize: 11,
                      marginLeft: 10,
                      marginTop: 2,
                    }}
                  >
                    {item.time}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default DriverDashboard

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
    marginRight: 10,
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  headerSub: {
    color: '#d8f3dc',
    fontSize: 12,
    marginTop: 2,
  },

  profileBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileText: {
    color: '#175812',
    fontWeight: 'bold',
    fontSize: 16,
  },

  dropdown: {
    position: 'absolute',
    top: 80,
    right: 18,
    backgroundColor: 'white',
    width: 230,
    borderRadius: 22,
    padding: 16,
    elevation: 10,
    zIndex: 999,
  },

  profileTop: {
    alignItems: 'center',
    marginBottom: 16,
  },

  profileCircle: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCircleText: {
    color: '#175812',
    fontSize: 24,
    fontWeight: 'bold',
  },

  driverName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },

  driverRole: {
    color: '#666',
    marginTop: 4,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  menuText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#111',
  },

  logoutBtn: {
    backgroundColor: '#e53935',
    marginTop: 12,
    borderRadius: 16,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  logoutText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  },

  welcomeCard: {
    backgroundColor: '#175812',
    margin: 18,
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
  },

  welcomeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },

  welcomeSubtitle: {
    color: '#d8f3dc',
    marginTop: 10,
    lineHeight: 22,
    width: '90%',
  },

  activeRideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginTop: 16,
  },

  activeRideText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },

  driverImage: {
    width: 85,
    height: 85,
    resizeMode: 'contain',
  },

  liveCard: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
  },

  liveTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  liveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },

  liveSub: {
    color: '#666',
    marginTop: 4,
  },

  liveBadge: {
    backgroundColor: '#e53935',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },

  liveBadgeText: {
    color: 'white',
    fontWeight: 'bold',
  },

  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },

  liveItem: {
    width: '48%',
    backgroundColor: '#f5f7fb',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },

  liveItemTitle: {
    marginTop: 10,
    color: '#666',
  },

  liveItemValue: {
    marginTop: 6,
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
  },

  sectionHeader: {
    marginHorizontal: 18,
    marginTop: 28,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },

  iconBox: {
    width: 65,
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionTitle: {
    marginTop: 14,
    fontWeight: '700',
    fontSize: 15,
    color: '#111',
  },

  recentCard: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 18,
    elevation: 4,
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  recentText: {
    marginLeft: 10,
    color: '#333',
    fontWeight: '500',
  },

  noRecentText: {
    color: '#777',
    textAlign: 'center',
  },
  emptyRideBox: {
    marginTop: 22,
    backgroundColor: '#f5f7fb',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },

  emptyRideTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  emptyRideText: {
    marginTop: 6,
    color: '#777',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionBadge: {
    position: 'absolute',
    top: 14,
    right: 30,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },

  actionBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },
  headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},

iconBtn: {
  marginRight: 6,
  position: 'relative',
},

notificationBadge: {
  position: 'absolute',
  top: -8,
  right: -8,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: '#e53935',
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 5,
  borderWidth: 1.5,
  borderColor: '#fff',
},

notificationBadgeText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: '900',
},
})
