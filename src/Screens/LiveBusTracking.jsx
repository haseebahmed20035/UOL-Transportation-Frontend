import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import notifee, { AndroidImportance } from '@notifee/react-native'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const NEAR_STOP_DISTANCE_METERS = 300
const LOCATION_REFRESH_INTERVAL = 5000

const LiveBusTracking = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const mapRef = useRef(null)
  const intervalRef = useRef(null)
  const mountedRef = useRef(true)
  const notificationSentRef = useRef(false)

  const [loading, setLoading] = useState(true)
  const [refreshingLocation, setRefreshingLocation] = useState(false)

  const [busData, setBusData] = useState(null)
  const [busLocation, setBusLocation] = useState(null)
  const [studentStop, setStudentStop] = useState(null)
  const [routeStops, setRouteStops] = useState([])
  const [distanceToStop, setDistanceToStop] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  useEffect(() => {
    mountedRef.current = true

    setupNotificationPermission()
    fetchLiveBusTracking(true)

    intervalRef.current = setInterval(() => {
      fetchLiveBusTracking(false)
    }, LOCATION_REFRESH_INTERVAL)

    return () => {
      mountedRef.current = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const setupNotificationPermission = async () => {
    try {
      await notifee.requestPermission()

      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'bus_tracking',
          name: 'Bus Tracking',
          importance: AndroidImportance.HIGH,
          sound: 'default',
        })
      }
    } catch (error) {
      console.log('Notification permission error:', error)
    }
  }

  const showBusNearNotification = async stopName => {
    try {
      await notifee.displayNotification({
        title: 'Bus is near your stop',
        body: `Your bus is near ${stopName || 'your stop'}. Please be ready.`,
        android: {
          channelId: 'bus_tracking',
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      })
    } catch (error) {
      console.log('Notification error:', error)
    }
  }

  const getStudentIdFromUser = user => {
  return user?.student_id || user?.studentId || user?.student?.id || null
}

  const toNumberOrNull = value => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
  }

  const getBusLatitude = bus => {
    return toNumberOrNull(
      bus?.latitude ||
        bus?.current_latitude ||
        bus?.lat ||
        bus?.bus_latitude ||
        bus?.location?.latitude ||
        bus?.location?.lat,
    )
  }

  const getBusLongitude = bus => {
    return toNumberOrNull(
      bus?.longitude ||
        bus?.current_longitude ||
        bus?.lng ||
        bus?.bus_longitude ||
        bus?.location?.longitude ||
        bus?.location?.lng,
    )
  }

  const getStopLatitude = stop => {
    return toNumberOrNull(stop?.latitude || stop?.lat || stop?.stop_latitude)
  }

  const getStopLongitude = stop => {
    return toNumberOrNull(stop?.longitude || stop?.lng || stop?.stop_longitude)
  }

  const normalizeApiData = responseData => {
    const rootData = responseData?.data || responseData

    const bus =
      rootData?.bus ||
      rootData?.liveBus ||
      rootData?.assignedBus ||
      rootData?.tracking ||
      rootData

    const stop =
      rootData?.studentStop ||
      rootData?.student_stop ||
      rootData?.stop ||
      rootData?.assignedStop ||
      rootData?.pickupStop ||
      null

    const stops =
      rootData?.routeStops ||
      rootData?.route_stops ||
      rootData?.stops ||
      rootData?.route?.stops ||
      []

    return {
      bus,
      stop,
      stops: Array.isArray(stops) ? stops : [],
    }
  }

  const fetchLiveBusTracking = async showLoader => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshingLocation(true)
      }

      const storedUser = await AsyncStorage.getItem('user')

      if (!storedUser) {
        if (showLoader) {
          Alert.alert(
            'Login Required',
            'Student data not found. Please login again.',
          )
        }
        resetTrackingData()
        return
      }

      const user = JSON.parse(storedUser)

      let studentId = getStudentIdFromUser(user)

      if (!studentId) {
        const userId = user?.user_id || user?.userId || user?.id

        if (!userId) {
          if (showLoader) {
            Alert.alert('Error', 'User ID not found. Please login again.')
          }
          resetTrackingData()
          return
        }

        const studentProfileResponse = await axios.get(
          `${BASE_URL}/student/${userId}`,
        )
        studentId = studentProfileResponse?.data?.student_id
      }

      if (!studentId) {
        if (showLoader) {
          Alert.alert('Error', 'Student ID not found.')
        }
        resetTrackingData()
        return
      }

      const response = await axios.get(
        `${BASE_URL}/student/live-bus/${studentId}`,
      )

      const responseData = response.data

      if (!responseData || responseData.success === false) {
        resetTrackingData()
        return
      }

      const { bus, stop, stops } = normalizeApiData(responseData)

      const latitude = getBusLatitude(bus)
      const longitude = getBusLongitude(bus)

      const stopLatitude = getStopLatitude(stop)
      const stopLongitude = getStopLongitude(stop)

      const updatedStudentStop =
        stopLatitude !== null && stopLongitude !== null
          ? {
              ...stop,
              latitude: stopLatitude,
              longitude: stopLongitude,
            }
          : stop || null

      const formattedStops = stops
        .map((item, index) => {
          const lat = getStopLatitude(item)
          const lng = getStopLongitude(item)

          if (lat === null || lng === null) return null

          return {
            ...item,
            latitude: lat,
            longitude: lng,
            stop_order: item?.stop_order || item?.order || index + 1,
            stop_name: item?.stop_name || item?.name || `Stop ${index + 1}`,
          }
        })
        .filter(Boolean)
        .sort(
          (a, b) =>
            Number(a.stop_order || a.order || 0) -
            Number(b.stop_order || b.order || 0),
        )

      setBusData(bus || null)
      setStudentStop(updatedStudentStop)
      setRouteStops(formattedStops)
      setLastUpdatedAt(new Date())

      if (latitude === null || longitude === null) {
        setBusLocation(null)
        setDistanceToStop(null)
        return
      }

      const updatedBusLocation = {
        latitude,
        longitude,
      }

      setBusLocation(updatedBusLocation)

      if (stopLatitude !== null && stopLongitude !== null) {
        const distance = calculateDistanceInMeters(
          latitude,
          longitude,
          stopLatitude,
          stopLongitude,
        )

        setDistanceToStop(distance)

        if (
          distance <= NEAR_STOP_DISTANCE_METERS &&
          notificationSentRef.current === false
        ) {
          notificationSentRef.current = true
          showBusNearNotification(
            updatedStudentStop?.stop_name || updatedStudentStop?.name,
          )
        }

        if (distance > NEAR_STOP_DISTANCE_METERS + 200) {
          notificationSentRef.current = false
        }
      } else {
        setDistanceToStop(null)
      }

      animateMap(updatedBusLocation, updatedStudentStop, formattedStops)
    } catch (error) {
      console.log(
        'Live tracking error:',
        error?.response?.data || error?.message,
      )

      if (showLoader) {
        Alert.alert(
          'Error',
          'Unable to load live bus tracking. Please check your internet or backend.',
        )
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshingLocation(false)
      }
    }
  }

  const resetTrackingData = () => {
    setBusData(null)
    setBusLocation(null)
    setStudentStop(null)
    setRouteStops([])
    setDistanceToStop(null)
    setLastUpdatedAt(null)
  }

  const animateMap = (busLoc, stop, stops) => {
    if (!mapRef.current || !busLoc) return

    const coordinates = [{ ...busLoc }]

    if (stop?.latitude && stop?.longitude) {
      coordinates.push({
        latitude: stop.latitude,
        longitude: stop.longitude,
      })
    }

    stops.forEach(item => {
      if (item?.latitude && item?.longitude) {
        coordinates.push({
          latitude: item.latitude,
          longitude: item.longitude,
        })
      }
    })

    setTimeout(() => {
      try {
        if (coordinates.length > 1) {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 90,
              right: 60,
              bottom: 310,
              left: 60,
            },
            animated: true,
          })
        } else {
          mapRef.current?.animateToRegion(
            {
              latitude: busLoc.latitude,
              longitude: busLoc.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            },
            800,
          )
        }
      } catch (error) {
        console.log('Map animation error:', error)
      }
    }, 400)
  }

  const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000
    const toRadians = value => (value * Math.PI) / 180

    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return earthRadius * c
  }

  const formatDistance = meters => {
    if (meters === null || meters === undefined) return 'Calculating...'

    if (meters < 1000) {
      return `${Math.round(meters)} meters away`
    }

    return `${(meters / 1000).toFixed(1)} km away`
  }

  const getApproxArrivalTime = () => {
    if (distanceToStop === null || distanceToStop === undefined) {
      return 'Calculating...'
    }

    const averageBusSpeedMetersPerMinute = 350
    const minutes = Math.max(
      1,
      Math.round(distanceToStop / averageBusSpeedMetersPerMinute),
    )

    return `${minutes} mins`
  }

  const getRouteCoordinates = () => {
    return routeStops
      .map(stop => {
        const lat = toNumberOrNull(stop.latitude)
        const lng = toNumberOrNull(stop.longitude)

        if (lat === null || lng === null) return null

        return {
          latitude: lat,
          longitude: lng,
        }
      })
      .filter(Boolean)
  }

  const isRideActive = (() => {
    const status = String(
      busData?.ride_status ||
        busData?.trip_status ||
        busData?.status ||
        busData?.bus_status ||
        '',
    ).toLowerCase()

    return (
      status === 'running' ||
      status === 'live' ||
      status === 'active' ||
      busData?.is_active === 1 ||
      busData?.is_active === true ||
      busData?.is_running === 1 ||
      busData?.is_running === true
    )
  })()

  const routeTitle =
    busData?.route_name ||
    busData?.route?.route_name ||
    `${busData?.source || busData?.route?.source || 'UOL'} → ${
      busData?.destination || busData?.route?.destination || 'Destination'
    }`

  const busNumber =
    busData?.bus_number ||
    busData?.bus_no ||
    busData?.number ||
    busData?.bus?.bus_number ||
    'Not Assigned'

  const lastUpdatedText = lastUpdatedAt
    ? `${String(lastUpdatedAt.getHours()).padStart(2, '0')}:${String(
        lastUpdatedAt.getMinutes(),
      ).padStart(2, '0')}:${String(lastUpdatedAt.getSeconds()).padStart(
        2,
        '0',
      )}`
    : 'Not updated yet'

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size='large' color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading live bus tracking...
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name='arrow-back' size={24} color={theme.colors.background} />
          </TouchableOpacity>

          <Text style={[styles.headerText, { color: theme.colors.background }]}>
            Live Bus Tracking
          </Text>

          <TouchableOpacity onPress={() => fetchLiveBusTracking(false)}>
            {refreshingLocation ? (
              <ActivityIndicator size='small' color={theme.colors.background} />
            ) : (
              <Icon name='refresh' size={23} color={theme.colors.background} />
            )}
          </TouchableOpacity>
        </View>

        {!busLocation ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconBox,
                { backgroundColor: theme.colors.option },
              ]}
            >
              <Icon name='bus-outline' size={42} color={theme.colors.primary} />
            </View>

            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No active bus tracking
            </Text>

            <Text style={[styles.emptyMessage, { color: theme.colors.icon }]}>
              Your assigned bus is not live right now. When the driver starts
              the ride, you will see the bus location here.
            </Text>

            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => fetchLiveBusTracking(true)}
            >
              <Icon name='refresh' size={18} color='#fff' />
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              mapType='standard'
              initialRegion={{
                latitude: busLocation.latitude,
                longitude: busLocation.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              showsTraffic={true}
              showsBuildings={true}
              showsIndoors={true}
              showsPointsOfInterest={true}
              toolbarEnabled={false}
              loadingEnabled={true}
            >
              {getRouteCoordinates().length > 1 && (
                <Polyline
                  coordinates={getRouteCoordinates()}
                  strokeWidth={4}
                  strokeColor={theme.colors.primary}
                />
              )}

              <Marker coordinate={busLocation} title='Your Bus'>
                <View style={styles.busMarker}>
                  <Icon name='bus' size={24} color='#fff' />
                </View>
              </Marker>

              {studentStop?.latitude && studentStop?.longitude && (
                <Marker
                  coordinate={{
                    latitude: studentStop.latitude,
                    longitude: studentStop.longitude,
                  }}
                  title={
                    studentStop.stop_name || studentStop.name || 'Your Stop'
                  }
                  description='Your pickup/drop location'
                >
                  <View style={styles.stopMarker}>
                    <Icon name='location' size={22} color='#fff' />
                  </View>
                </Marker>
              )}

              {routeStops.map((stop, index) => {
                const lat = toNumberOrNull(stop.latitude)
                const lng = toNumberOrNull(stop.longitude)

                if (lat === null || lng === null) return null

                const isStudentStop =
                  studentStop?.latitude === lat &&
                  studentStop?.longitude === lng

                if (isStudentStop) return null

                return (
                  <Marker
                    key={`route-stop-${index}`}
                    coordinate={{
                      latitude: lat,
                      longitude: lng,
                    }}
                    title={stop.stop_name || stop.name || `Stop ${index + 1}`}
                  >
                    <View style={styles.smallStopMarker}>
                      <Text style={styles.smallStopText}>{index + 1}</Text>
                    </View>
                  </Marker>
                )
              })}
            </MapView>

            <ScrollView
              style={styles.bottomSheet}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.routeCard,
                  {
                    backgroundColor: theme.colors.option,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.routeTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.routeTitle, { color: theme.colors.text }]}
                    >
                      {routeTitle}
                    </Text>

                    <Text
                      style={[
                        styles.routeSubtitle,
                        { color: theme.colors.icon },
                      ]}
                    >
                      {studentStop?.stop_name || studentStop?.name
                        ? `Your stop: ${
                            studentStop.stop_name || studentStop.name
                          }`
                        : 'Your stop is not available'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.liveBadge,
                      {
                        backgroundColor: isRideActive ? '#E8F8EF' : '#FFF7E6',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.liveDot,
                        {
                          backgroundColor: isRideActive ? '#0A8F3C' : '#D97706',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.liveBadgeText,
                        {
                          color: isRideActive ? '#0A8F3C' : '#D97706',
                        },
                      ]}
                    >
                      {isRideActive ? 'LIVE' : 'TRACKING'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.badge, { backgroundColor: theme.colors.box }]}
                >
                  <Icon
                    name='bus-outline'
                    size={16}
                    color={theme.colors.text}
                  />
                  <Text
                    style={[styles.badgeText, { color: theme.colors.text }]}
                  >
                    Bus No: {busNumber}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View
                    style={[
                      styles.infoBox,
                      { backgroundColor: theme.colors.box },
                    ]}
                  >
                    <Icon
                      name='time-outline'
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[styles.infoLabel, { color: theme.colors.icon }]}
                    >
                      Arrives in
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.colors.text }]}
                    >
                      {getApproxArrivalTime()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.infoBox,
                      { backgroundColor: theme.colors.box },
                    ]}
                  >
                    <Icon
                      name='navigate-outline'
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[styles.infoLabel, { color: theme.colors.icon }]}
                    >
                      Distance
                    </Text>
                    <Text
                      style={[styles.infoValue, { color: theme.colors.text }]}
                    >
                      {formatDistance(distanceToStop)}
                    </Text>
                  </View>
                </View>

                <View style={styles.updateRow}>
                  <Icon
                    name='sync-outline'
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[styles.updateText, { color: theme.colors.icon }]}
                  >
                    Auto refresh every 5 seconds • Last update:{' '}
                    {lastUpdatedText}
                  </Text>
                </View>

                {distanceToStop !== null &&
                  distanceToStop <= NEAR_STOP_DISTANCE_METERS && (
                    <View style={styles.nearAlertBox}>
                      <Icon name='notifications' size={20} color='#B45309' />
                      <Text style={styles.nearAlertText}>
                        Your bus is near your stop. Please be ready.
                      </Text>
                    </View>
                  )}
              </View>
            </ScrollView>
          </>
        )}
      </View>
    </SafeAreaProvider>
  )
}

export default LiveBusTracking

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
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

  map: {
    flex: 1,
  },

  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 285,
  },

  routeCard: {
    margin: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  routeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },

  routeSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    marginRight: 5,
  },

  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  infoBox: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },

  updateRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  updateText: {
    marginLeft: 6,
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
  },

  nearAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },

  nearAlertText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12.5,
    fontWeight: '700',
    marginLeft: 8,
  },

  busMarker: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: '#175812',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  stopMarker: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  smallStopMarker: {
    width: 26,
    height: 26,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },

  smallStopText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  emptyIconBox: {
    width: 82,
    height: 82,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },

  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 7,
  },
})
