import React, { useContext, useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL, endPoints } from '../services/baseUrl'

const StudentNotification = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState(null)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    loadUserAndNotifications()
  }, [])

  const loadUserAndNotifications = async () => {
    try {
      setLoading(true)

      const storedUser = await AsyncStorage.getItem('user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      const loggedInUserId =
        parsedUser?.user_id || parsedUser?.id || parsedUser?.userId

      if (!loggedInUserId) {
        setNotifications([])
        return
      }

      setUserId(loggedInUserId)

      await fetchNotifications(loggedInUserId)
    } catch (error) {
      console.log('Load notifications error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotifications = async id => {
    try {
      const response = await axios.get(
        `${BASE_URL}/${endPoints.getUserNotifications}/${id}`,
      )

      const list = response.data?.notifications || []

      setNotifications(list)
    } catch (error) {
      console.log('Fetch notifications error:', error?.response?.data || error)

      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to load notifications.',
      )
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)

    const id = userId

    if (id) {
      await fetchNotifications(id)
    } else {
      await loadUserAndNotifications()
    }

    setRefreshing(false)
  }

  const markAsRead = async item => {
    try {
      if (Number(item?.is_read) === 1) return

      await axios.put(
        `${BASE_URL}/${endPoints.markNotificationRead}/${item.user_notification_id}`,
      )

      setNotifications(prev =>
        prev.map(notification =>
          notification.user_notification_id === item.user_notification_id
            ? { ...notification, is_read: 1 }
            : notification,
        ),
      )
    } catch (error) {
      console.log(
        'Mark notification read error:',
        error?.response?.data || error,
      )
    }
  }

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return

    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(true)

              await axios.delete(
                `${BASE_URL}/${endPoints.clearUserNotifications}/${userId}`,
              )

              setNotifications([])
            } catch (error) {
              console.log(
                'Clear student notifications error:',
                error?.response?.data || error,
              )

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  'Failed to clear notifications.',
              )
            } finally {
              setClearing(false)
            }
          },
        },
      ],
    )
  }

  const formatDateTime = value => {
    if (!value) return ''

    const date = new Date(value)

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const unreadCount = notifications.filter(
    item => Number(item.is_read) === 0,
  ).length

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.background} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.background }]}>
          Notifications
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconBox}>
              <Icon name='notifications' size={28} color='#175812' />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Admin Notifications</Text>

              <Text style={styles.summarySubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount > 1 ? 's' : ''
                    }`
                  : 'You are all caught up'}
              </Text>
            </View>

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.85}
                disabled={clearing}
                onPress={clearAllNotifications}
              >
                {clearing ? (
                  <ActivityIndicator size='small' color='#175812' />
                ) : (
                  <>
                    <Icon name='trash-outline' size={16} color='#175812' />
                    <Text style={styles.clearBtnText}>Clear</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Icon
                  name='notifications-off-outline'
                  size={42}
                  color='#175812'
                />
              </View>

              <Text style={styles.emptyTitle}>No Notifications</Text>

              <Text style={styles.emptyText}>
                You have not received any admin notification yet.
              </Text>
            </View>
          ) : (
            notifications.map(item => {
              const isUnread = Number(item.is_read) === 0

              return (
                <TouchableOpacity
                  key={item.user_notification_id}
                  activeOpacity={0.85}
                  style={[
                    styles.notificationCard,
                    isUnread && styles.unreadNotificationCard,
                  ]}
                  onPress={() => markAsRead(item)}
                >
                  <View
                    style={[
                      styles.notificationIconBox,
                      isUnread && {
                        backgroundColor: '#175812',
                      },
                    ]}
                  >
                    <Icon
                      name={
                        isUnread ? 'notifications' : 'notifications-outline'
                      }
                      size={22}
                      color={isUnread ? '#fff' : '#175812'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.notificationTop}>
                      <Text
                        style={[
                          styles.notificationTitle,
                          isUnread && styles.unreadTitle,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>

                      {isUnread && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.notificationMessage}>
                      {item.message}
                    </Text>

                    <View style={styles.notificationFooter}>
                      <Icon name='time-outline' size={14} color='#777' />

                      <Text style={styles.notificationDate}>
                        {formatDateTime(item.created_at)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            })
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default StudentNotification

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
    fontSize: 18,
    fontWeight: 'bold',
  },

  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#175812',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  summaryIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  summarySubtitle: {
    color: '#d8f3dc',
    fontSize: 13,
    marginTop: 5,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },

  emptyText: {
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  unreadNotificationCard: {
    borderColor: '#175812',
    backgroundColor: '#F3FBF3',
  },

  notificationIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  notificationTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },

  unreadTitle: {
    fontWeight: '900',
    color: '#111',
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#e53935',
    marginLeft: 8,
  },

  notificationMessage: {
    color: '#555',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  notificationDate: {
    marginLeft: 5,
    color: '#777',
    fontSize: 11,
    fontWeight: '600',
  },
  clearBtn: {
    minWidth: 78,
    height: 38,
    borderRadius: 100,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginLeft: 10,
  },

  clearBtnText: {
    color: '#175812',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 5,
  },
})
