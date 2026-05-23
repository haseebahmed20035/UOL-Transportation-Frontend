import {
  Alert,
  Animated,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
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
import { fetchAndShowUserNotifications } from '../utils/notificationHelper'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const StudentDashboard = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const [student, setStudent] = useState(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [recentScreens, setRecentScreens] = useState([])
  const [searchText, setSearchText] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [liveBusData, setLiveBusData] = useState(null)
  const [liveBusLoading, setLiveBusLoading] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [notifications, setNotifications] = useState([])

  const unreadNotificationCount = notifications.filter(
    item => Number(item.is_read) === 0,
  ).length

  useFocusEffect(
    useCallback(() => {
      const loadNotificationsOnFocus = async () => {
        const storedUser = await AsyncStorage.getItem('user')
        const parsedUser = storedUser ? JSON.parse(storedUser) : null

        const userId =
          parsedUser?.user_id || parsedUser?.id || parsedUser?.userId

        await fetchAndShowUserNotifications({
          userId,
          role: 'student',
          setNotifications,
        })
      }

      loadNotificationsOnFocus()
    }, []),
  )
  useEffect(() => {
    let intervalId

    const loadNotifications = async () => {
      const storedUser = await AsyncStorage.getItem('user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      const userId = parsedUser?.user_id || parsedUser?.id || parsedUser?.userId

      await fetchAndShowUserNotifications({
        userId,
        role: 'student',
        setNotifications,
      })
    }

    loadNotifications()

    intervalId = setInterval(() => {
      loadNotifications()
    }, 10000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [])
  const fetchStudentData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user')

      if (!userData) return

      const user = JSON.parse(userData)

      const userId = user?.user_id || user?.id || user?.userId

      const res = await fetch(`${BASE_URL}/${endPoints.student}/${userId}`)

      const data = await res.json()

      setStudent(data)
    } catch (err) {
      console.log('ERROR:', err)
    }
  }

  const fetchLiveBusData = async () => {
    try {
      setLiveBusLoading(true)

      const userData = await AsyncStorage.getItem('user')

      if (!userData) {
        setLiveBusData(null)
        return
      }

      const user = JSON.parse(userData)

      const studentId =
        user?.student_id ||
        user?.studentId ||
        user?.id ||
        user?.user_id ||
        user?.userId

      if (!studentId) {
        setLiveBusData(null)
        return
      }

      const res = await fetch(`${BASE_URL}/student/live-bus/${studentId}`)

      const data = await res.json()

      if (!res.ok || data?.success === false) {
        setLiveBusData(null)
        return
      }

      const bus = data?.bus || data?.data?.bus || data
      const studentStop =
        data?.studentStop || data?.data?.studentStop || data?.stop || null

      setLiveBusData({
        busNumber:
          bus?.bus_number || bus?.bus_no || bus?.number || 'Not Assigned',

        routeName:
          bus?.route_name ||
          `${bus?.source || 'UOL'} → ${bus?.destination || 'Destination'}`,

        currentStop:
          bus?.current_stop ||
          bus?.current_stop_name ||
          bus?.nearest_stop ||
          studentStop?.stop_name ||
          studentStop?.name ||
          'Not Available',

        eta:
          bus?.eta ||
          bus?.estimated_arrival ||
          bus?.arrival_time ||
          'Calculating...',

        status:
          bus?.ride_status || bus?.status || bus?.tracking_status || 'inactive',

        isLive:
          bus?.ride_status === 'active' ||
          bus?.status === 'active' ||
          bus?.is_active === 1 ||
          bus?.is_active === true ||
          bus?.is_running === 1 ||
          bus?.is_running === true,
      })
    } catch (err) {
      console.log('LIVE BUS ERROR:', err)
      setLiveBusData(null)
    } finally {
      setLiveBusLoading(false)
    }
  }

  useEffect(() => {
    fetchStudentData()
    fetchLiveBusData()
    loadRecent()

    const liveInterval = setInterval(() => {
      fetchLiveBusData()
    }, 5000)

    return () => clearInterval(liveInterval)
  }, [])

  const loadRecent = async () => {
    const stored = await AsyncStorage.getItem('recentScreens')

    if (stored) {
      setRecentScreens(JSON.parse(stored))
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)

    await fetchStudentData()
    await fetchLiveBusData()

    const storedUser = await AsyncStorage.getItem('user')
    const parsedUser = storedUser ? JSON.parse(storedUser) : null

    const userId = parsedUser?.user_id || parsedUser?.id || parsedUser?.userId

    await fetchAndShowUserNotifications({
      userId,
      role: 'student',
      setNotifications,
    })

    setRefreshing(false)
  }

  const navigateAndTrack = async screenName => {
    const time = new Date().toLocaleTimeString()

    const updated = [
      {
        name: screenName,
        time,
      },

      ...recentScreens.filter(s => s.name !== screenName),
    ].slice(0, 5)

    setRecentScreens(updated)

    await AsyncStorage.setItem('recentScreens', JSON.stringify(updated))

    navigation.navigate(screenName)
  }

  const menuAnimation = () => {
    setMenuVisible(!menuVisible)

    Animated.timing(fadeAnim, {
      toValue: menuVisible ? 0 : 1,

      duration: 250,

      useNativeDriver: true,
    }).start()
  }

  const quickActions = [
    {
      title: 'My Route',

      icon: 'navigate',

      color: '#2196F3',

      screen: 'MyRoute',
    },

    {
      title: 'Live Tracking',

      icon: 'bus',

      color: '#4CAF50',

      screen: 'LiveBusTracking',
    },

    {
      title: 'Notifications',
      icon: 'notifications',
      color: '#009688',
      screen: 'StudentNotification',
    },

    // {
    //   title: 'Bus Schedule',

    //   icon: 'calendar',

    //   color: '#FF9800',

    //   screen: 'BusSchedule',
    // },

    {
      title: 'Complaints',

      icon: 'chatbox',

      color: '#9C27B0',

      screen: 'StudentComplaint',
    },

    // {
    //   title:
    //     'Change Route',

    //   icon:
    //     'swap-horizontal',

    //   color:
    //     '#00BCD4',

    //   screen:
    //     'ChangeRoute',
    // },

    {
      title: 'Transport Request',

      icon: 'document-text',

      color: '#E91E63',

      screen: 'RequestForTransport',
    },
  ]

  const filteredScreens = quickActions.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase()),
  )

  return (
    <SafeAreaProvider>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
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
              <Text style={styles.headerTitle}>Student Dashboard</Text>

              <Text style={styles.headerSub}>UOL Transportation</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('StudentNotification')}
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
            <TouchableOpacity style={styles.avatar} onPress={menuAnimation}>
              <Text style={styles.avatarText}>
                {student?.name?.charAt(0) || 'S'}
              </Text>
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
                <Text style={styles.profileCircleText}>
                  {student?.name?.charAt(0) || 'S'}
                </Text>
              </View>

              <Text style={styles.profileName}>{student?.name}</Text>

              <Text style={styles.profileRole}>Student</Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateAndTrack('MyPersonalInfo')}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        >
          {/* WELCOME CARD */}
          <View
            style={[
              styles.welcomeCard,
              { backgroundColor: theme.colors.dashboard },
            ]}
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                Welcome, {student?.name || 'Student'}
                👋
              </Text>

              <Text
                style={[styles.welcomeSubtitle, { color: theme.colors.text }]}
              >
                {liveBusData?.isLive
                  ? `Bus arriving in ${
                      liveBusData?.eta || 'Calculating...'
                    }. Your route is active today.`
                  : 'Your bus is not live right now. You can check again when the driver starts the ride.'}
              </Text>

              <View style={styles.liveChip}>
                <Icon
                  name='radio-button-on'
                  size={12}
                  color={liveBusData?.isLive ? '#4CAF50' : '#FF9800'}
                />

                <Text style={styles.liveChipText}>
                  {liveBusData?.isLive
                    ? 'Transport Active'
                    : 'Transport Inactive'}
                </Text>
              </View>
            </View>

            <Image
              source={{
                uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png',
              }}
              style={styles.studentImage}
            />
          </View>

          {/* LIVE TRACKING */}
          <View
            style={[
              styles.liveCard,
              { backgroundColor: theme.colors.dashboard },
            ]}
          >
            <View style={styles.liveTop}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  navigateAndTrack('LiveBusTracking')
                }}
              >
                <Text style={[styles.liveTitle, { color: theme.colors.text }]}>
                  Live Bus Status
                </Text>

                <Text style={styles.liveSub}>
                  {liveBusLoading
                    ? 'Loading bus details...'
                    : `Bus #${liveBusData?.busNumber || 'Not Assigned'}`}
                </Text>

                <Text style={styles.liveRouteText}>
                  {liveBusData?.routeName || 'No active route found'}
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.liveBadge,
                  {
                    backgroundColor: liveBusData?.isLive
                      ? '#e53935'
                      : '#9E9E9E',
                  },
                ]}
              >
                <Text style={styles.liveBadgeText}>
                  {liveBusData?.isLive ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
            </View>

            <View style={styles.liveRow}>
              <View style={styles.liveItem}>
                <Icon name='location' size={22} color='#2196F3' />

                <Text style={[styles.liveItemTitle]}>Current Stop</Text>

                <Text style={styles.liveItemValue}>
                  {liveBusData?.currentStop || 'Not Available'}
                </Text>
              </View>

              <View style={styles.liveItem}>
                <Icon name='time' size={22} color='#FF9800' />

                <Text style={styles.liveItemTitle}>ETA</Text>

                <Text style={styles.liveItemValue}>
                  {liveBusData?.eta || 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quick Actions
            </Text>
          </View>

          <View style={styles.grid}>
            {quickActions.map(item => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.actionCard,
                  { backgroundColor: theme.colors.dashboard },
                ]}
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

                <Text
                  style={[styles.actionTitle, { color: theme.colors.text }]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SEARCH */}
          <View
            style={[
              styles.searchCard,
              { backgroundColor: theme.colors.dashboard },
            ]}
          >
            <View
              style={[
                styles.searchWrapper,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Icon name='search' size={18} color={theme.colors.icon} />

              <TextInput
                placeholder='Search feature...'
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
              />
            </View>

            {searchText !== '' &&
              filteredScreens.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.searchResult,
                    { backgroundColor: theme.colors.dashboard },
                  ]}
                  onPress={() => navigateAndTrack(item.screen)}
                >
                  <Text
                    style={{
                      color: '#111',
                    }}
                  >
                    🔍 {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          {/* RECENT */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Activities
            </Text>
          </View>

          <View
            style={[
              styles.recentCard,
              { backgroundColor: theme.colors.dashboard },
            ]}
          >
            {recentScreens.length === 0 ? (
              <Text style={[styles.noRecentText, { color: theme.colors.text }]}>
                No recent activities
              </Text>
            ) : (
              recentScreens.map((item, index) => (
                <View key={index} style={styles.recentItem}>
                  <Icon
                    name='time-outline'
                    size={18}
                    color={theme.colors.icon}
                  />

                  <View>
                    <Text
                      style={[styles.recentText, { color: theme.colors.text }]}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={[
                        {
                          color: '#777',
                          fontSize: 11,
                          marginLeft: 10,
                          marginTop: 2,
                        },
                        { color: theme.colors.text },
                      ]}
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
    </SafeAreaProvider>
  )
}

export default StudentDashboard

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

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  iconBtn: {
    marginRight: 6,
    position: 'relative',
  },

  avatar: {
    backgroundColor: 'white',
    height: 40,
    width: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
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

  profileName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 10,
  },

  profileRole: {
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

  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    marginTop: 16,
  },

  liveChipText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },

  studentImage: {
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
    textAlign: 'center',
  },

  searchCard: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    marginTop: 10,
    borderRadius: 24,
    padding: 18,
    elevation: 4,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fb',
    borderRadius: 16,
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 6,
    color: '#111',
  },

  searchResult: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
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
})
