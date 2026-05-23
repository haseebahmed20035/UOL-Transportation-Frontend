import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import Geolocation from 'react-native-geolocation-service';
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'
import {
  startTripLocationService,
  stopTripLocationService,
} from '../services/TripLocationService'

const DEFAULT_LOCATION = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
}

const START_POINT_ALLOWED_DISTANCE_METERS = 120

const TripControl = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const mapRef = useRef(null)
  const watchIdRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const busMoveAnim = useRef(new Animated.Value(0)).current
  const [loading, setLoading] = useState(true)
  const [startingTrip, setStartingTrip] = useState(false)
  const [endingTrip, setEndingTrip] = useState(false)

  const [driverData, setDriverData] = useState(null)
  const [assignedTrip, setAssignedTrip] = useState(null)

  const [tripStarted, setTripStarted] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_LOCATION)
  const [locationReady, setLocationReady] = useState(true)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [lastLocationTime, setLastLocationTime] = useState(null)
  const [trackingActive, setTrackingActive] = useState(false)
  const [distanceFromStart, setDistanceFromStart] = useState(null)

  useEffect(() => {
    if (!tripStarted) return

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    )

    const busLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(busMoveAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(busMoveAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    )

    pulseLoop.start()
    busLoop.start()

    return () => {
      pulseLoop.stop()
      busLoop.stop()
    }
  }, [tripStarted])

  useEffect(() => {
    mountedRef.current = true
    initializeScreen()

    return () => {
      mountedRef.current = false

      // Do not stop live tracking here.
      // Tracking should continue after leaving this screen.
      stopRideTimer()
    }
  }, [])
  const restoreActiveTripTimer = async () => {
    try {
      const activeTripString = await AsyncStorage.getItem('activeTrip')
      const activeTrip = activeTripString ? JSON.parse(activeTripString) : null

      if (!activeTrip?.started_at) return false

      const startedAt = new Date(activeTrip.started_at).getTime()
      const now = new Date().getTime()

      const seconds = Math.floor((now - startedAt) / 1000)

      setElapsedSeconds(seconds > 0 ? seconds : 0)
      setTripStarted(true)
      setTrackingActive(true)

      startRideTimerFromStartedAt(activeTrip.started_at)

      return true
    } catch (error) {
      console.log('Restore active trip timer error:', error)
      return false
    }
  }
  const startRideTimerFromStartedAt = startedAt => {
    stopRideTimer()

    timerRef.current = setInterval(() => {
      const startedTime = new Date(startedAt).getTime()
      const now = new Date().getTime()
      const seconds = Math.floor((now - startedTime) / 1000)

      setElapsedSeconds(seconds > 0 ? seconds : 0)
    }, 1000)
  }
  const initializeScreen = async () => {
    setLoading(true)

    try {
      const userString = await AsyncStorage.getItem('user')
      const user = userString ? JSON.parse(userString) : null

      console.log('Driver user from AsyncStorage:', user)

      setDriverData(user)
      setCurrentLocation(DEFAULT_LOCATION)
      setLocationReady(true)

      await fetchAssignedTrip(user)
      await restoreActiveTripTimer()
    } catch (error) {
      console.log('Trip control init error:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        const auth = await Geolocation.requestAuthorization('whenInUse')
        return auth === 'granted'
      }

      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ])

      const fineGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED

      const coarseGranted =
        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED

      return fineGranted || coarseGranted
    } catch (error) {
      console.log('Permission error:', error)
      return false
    }
  }

  const getDriverId = user => {
    return user?.driver_id || user?.id || user?.user_id || user?.userId
  }

  const fetchAssignedTrip = async user => {
    try {
      const driverId = getDriverId(user)

      if (!driverId) {
        console.log('Driver ID not found in AsyncStorage user:', user)
        setAssignedTrip(null)
        return
      }

      const response = await fetch(`${BASE_URL}/driver/my-route/${driverId}`)
      const json = await response.json()

      console.log('Driver route response:', json)

      if (json?.success && json?.data) {
        const data = json.data

        const formattedTrip = {
          bus_id: data.bus?.id,
          bus_number: data.bus?.bus_number,
          capacity: data.bus?.capacity,
          route_id: data.route?.id,
          route_name: data.route?.route_name,
          source: data.route?.source,
          destination: data.route?.destination,
          estimated_time: data.route?.estimated_time,
          status: data.bus?.status,
          stops: Array.isArray(data.route?.stops) ? data.route.stops : [],
        }

        setAssignedTrip(formattedTrip)

        if (formattedTrip.status === 'running') {
          setTripStarted(true)
          startRideTimer()
        }
      } else {
        setAssignedTrip(null)
      }
    } catch (error) {
      console.log('Fetch assigned trip error:', error)
      setAssignedTrip(null)
    }
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

  const getValidSortedStops = () => {
    if (!assignedTrip?.stops || !Array.isArray(assignedTrip.stops)) {
      return []
    }

    return assignedTrip.stops
      .filter(stop => {
        const lat = Number(stop.latitude)
        const lng = Number(stop.longitude)
        return !Number.isNaN(lat) && !Number.isNaN(lng)
      })
      .sort(
        (a, b) =>
          Number(a.stop_order || a.order || 0) -
          Number(b.stop_order || b.order || 0),
      )
  }

  const getRouteStartingPoint = () => {
    const validStops = getValidSortedStops()

    if (validStops.length === 0) {
      return null
    }

    const firstStop = validStops[0]

    return {
      latitude: Number(firstStop.latitude),
      longitude: Number(firstStop.longitude),
      name: firstStop.stop_name || firstStop.name || 'Starting Point',
    }
  }

  const checkDriverAtStartingPoint = driverLocation => {
    const startingPoint = getRouteStartingPoint()

    if (!startingPoint) {
      return {
        allowed: false,
        distance: null,
        startingPoint: null,
        message: 'Route starting location is not available.',
      }
    }

    const distance = calculateDistanceInMeters(
      driverLocation.latitude,
      driverLocation.longitude,
      startingPoint.latitude,
      startingPoint.longitude,
    )

    return {
      allowed: distance <= START_POINT_ALLOWED_DISTANCE_METERS,
      distance,
      startingPoint,
      message:
        distance <= START_POINT_ALLOWED_DISTANCE_METERS
          ? 'Driver is at the starting point.'
          : `You are ${Math.round(
              distance,
            )} meters away from the route starting point.`,
    }
  }

  const getCurrentLocationSafely = () => {
    return new Promise(resolve => {
      try {
        Geolocation.getCurrentPosition(
          position => {
            const latitude = Number(position?.coords?.latitude)
            const longitude = Number(position?.coords?.longitude)

            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
              resolve(null)
              return
            }

            const location = {
              latitude,
              longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }

            setCurrentLocation(location)
            setLocationReady(true)
            setLastLocationTime(new Date())

            try {
              mapRef.current?.animateToRegion(location, 800)
            } catch (mapError) {
              console.log('Map animate error:', mapError)
            }

            resolve(location)
          },
          error => {
            console.log('Current location error:', error)
            resolve(null)
          },
          {
            enableHighAccuracy: false,
            timeout: 20000,
            maximumAge: 10000,
          },
        )
      } catch (error) {
        console.log('Get current location error:', error)
        resolve(null)
      }
    })
  }

  const startTrip = async () => {
    if (startingTrip) return

    try {
      if (!assignedTrip) {
        Alert.alert('No Assigned Trip', 'No bus or route is assigned to you.')
        return
      }

      const driverId = getDriverId(driverData)

      if (!driverId) {
        Alert.alert('Driver Error', 'Driver ID not found. Please login again.')
        return
      }

      if (!assignedTrip?.bus_id || !assignedTrip?.route_id) {
        Alert.alert('Trip Error', 'Bus or route information is missing.')
        return
      }

      const startingPoint = getRouteStartingPoint()

      if (!startingPoint) {
        Alert.alert(
          'Starting Point Missing',
          'This route does not have a valid starting stop location. Please add route stops with latitude and longitude first.',
        )
        return
      }

      setStartingTrip(true)

      const hasPermission = await requestLocationPermission()

      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please allow location permission.')
        return
      }

      const location = await getCurrentLocationSafely()

      if (!location) {
        Alert.alert(
          'Location Error',
          'Unable to get your current location. Please turn on GPS/location and try again.',
        )
        return
      }

      const startPointCheck = checkDriverAtStartingPoint(location)

      setDistanceFromStart(startPointCheck.distance)

      if (!startPointCheck.allowed) {
        Alert.alert(
          'Not at Starting Point',
          `${startPointCheck.message}\n\nPlease go near: ${
            startPointCheck.startingPoint?.name || 'Starting Point'
          }\nAllowed range: ${START_POINT_ALLOWED_DISTANCE_METERS} meters.`,
        )
        return
      }

      const response = await fetch(`${BASE_URL}/start-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          bus_id: assignedTrip.bus_id,
          route_id: assignedTrip.route_id,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })

      const json = await response.json()

      if (json?.success) {
        setTripStarted(true)
        setTrackingActive(true)
        setElapsedSeconds(0)

        await startTripLocationService(assignedTrip)

        const activeTripString = await AsyncStorage.getItem('activeTrip')
        const activeTrip = activeTripString
          ? JSON.parse(activeTripString)
          : null

        if (activeTrip?.started_at) {
          startRideTimerFromStartedAt(activeTrip.started_at)
        }

        Alert.alert(
          'Ride Started',
          'You are at the starting point. Students can now track the bus.',
        )
      } else {
        Alert.alert('Error', json?.message || 'Unable to start ride.')
      }
    } catch (error) {
      console.log('Start trip error:', error)
      Alert.alert('Error', 'Something went wrong while starting ride.')
    } finally {
      setStartingTrip(false)
    }
  }

  const endTrip = async () => {
    if (endingTrip) return

    try {
      if (!assignedTrip) {
        Alert.alert('Trip Error', 'Trip data not found.')
        return
      }

      const driverId = getDriverId(driverData)

      if (!driverId) {
        Alert.alert('Driver Error', 'Driver ID not found.')
        return
      }

      setEndingTrip(true)

      const response = await fetch(`${BASE_URL}/end-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          bus_id: assignedTrip?.bus_id,
          route_id: assignedTrip?.route_id,
        }),
      })

      const json = await response.json()

      if (json?.success) {
        await stopTripLocationService()

        stopLocationWatch()
        stopRideTimer()

        setTripStarted(false)
        setTrackingActive(false)

        Alert.alert(
          'Ride Ended',
          'Ride timer and live tracking have been stopped.',
        )
      } else {
        Alert.alert('Error', json?.message || 'Unable to end ride.')
      }
    } catch (error) {
      console.log('End trip error:', error)
      Alert.alert('Error', 'Something went wrong while ending ride.')
    } finally {
      setEndingTrip(false)
    }
  }

  const startLocationWatchSafely = (trip, driverId) => {
    try {
      stopLocationWatch()

      if (!trip?.bus_id || !trip?.route_id || !driverId) {
        console.log('Cannot start location watch. Missing data:', {
          trip,
          driverId,
        })
        return
      }

      watchIdRef.current = Geolocation.watchPosition(
        position => {
          const latitude = Number(position?.coords?.latitude)
          const longitude = Number(position?.coords?.longitude)

          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return
          }

          const location = {
            latitude,
            longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }

          setCurrentLocation(location)
          setLastLocationTime(new Date())
          setTrackingActive(true)

          sendLiveLocationToBackend(location, trip, driverId)

          try {
            mapRef.current?.animateToRegion(location, 700)
          } catch (mapError) {
            console.log('Watch map animate error:', mapError)
          }
        },
        error => {
          console.log('Watch location error:', error)
          setTrackingActive(false)
        },
        {
          enableHighAccuracy: false,
          distanceFilter: 20,
          interval: 8000,
          fastestInterval: 5000,
        },
      )
    } catch (error) {
      console.log('Start location watch error:', error)
      setTrackingActive(false)
    }
  }

  const stopLocationWatch = () => {
    try {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    } catch (error) {
      console.log('Stop location watch error:', error)
    }
  }

  const sendLiveLocationToBackend = async (location, trip, driverId) => {
    try {
      await fetch(`${BASE_URL}/update-bus-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driver_id: driverId,
          bus_id: trip?.bus_id,
          route_id: trip?.route_id,
          latitude: location.latitude,
          longitude: location.longitude,
          status: 'running',
        }),
      })
    } catch (error) {
      console.log('Send live location error:', error)
    }
  }

  const startRideTimer = async () => {
    const activeTripString = await AsyncStorage.getItem('activeTrip')
    const activeTrip = activeTripString ? JSON.parse(activeTripString) : null

    if (activeTrip?.started_at) {
      startRideTimerFromStartedAt(activeTrip.started_at)
      return
    }

    stopRideTimer()

    const fallbackStartedAt = new Date().toISOString()

    timerRef.current = setInterval(() => {
      const startedTime = new Date(fallbackStartedAt).getTime()
      const now = new Date().getTime()
      const seconds = Math.floor((now - startedTime) / 1000)

      setElapsedSeconds(seconds > 0 ? seconds : 0)
    }, 1000)
  }

  const stopRideTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const resetRideTimer = () => {
    stopRideTimer()
    setElapsedSeconds(0)
  }

  const formatDuration = totalSeconds => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`
  }

  const formatLastLocationTime = date => {
    if (!date) return 'Not updated yet'

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  }

  const getNearestAndNextStop = () => {
    const stops = getValidSortedStops()

    if (!currentLocation || stops.length === 0) {
      return {
        currentStop: null,
        nextStop: null,
        nextStopNumber: null,
        distanceToNextStop: null,
      }
    }

    const stopsWithDistance = stops.map((stop, index) => {
      const stopLat = Number(stop.latitude)
      const stopLng = Number(stop.longitude)

      const distance = calculateDistanceInMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        stopLat,
        stopLng,
      )

      return {
        ...stop,
        index,
        distance,
        name: stop.stop_name || stop.name || `Stop ${index + 1}`,
      }
    })

    stopsWithDistance.sort((a, b) => a.distance - b.distance)

    const nearestStop = stopsWithDistance[0]

    const originalStops = getValidSortedStops()

    const nearestOriginalIndex = originalStops.findIndex(stop => {
      return (
        Number(stop.latitude) === Number(nearestStop.latitude) &&
        Number(stop.longitude) === Number(nearestStop.longitude)
      )
    })

    const nextStop =
      nearestOriginalIndex >= 0 &&
      nearestOriginalIndex + 1 < originalStops.length
        ? originalStops[nearestOriginalIndex + 1]
        : null

    return {
      currentStop: nearestStop,
      nextStop: nextStop
        ? {
            ...nextStop,
            name:
              nextStop.stop_name ||
              nextStop.name ||
              `Stop ${nearestOriginalIndex + 2}`,
          }
        : null,
      nextStopNumber: nextStop ? nearestOriginalIndex + 2 : null,
      distanceToNextStop: nextStop
        ? calculateDistanceInMeters(
            currentLocation.latitude,
            currentLocation.longitude,
            Number(nextStop.latitude),
            Number(nextStop.longitude),
          )
        : null,
    }
  }

  const stopStatus = getNearestAndNextStop()

  const animatedBusTranslate = busMoveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 55],
  })

  const routeCoordinates = getValidSortedStops().map(stop => ({
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude),
  }))

  const startingPoint = getRouteStartingPoint()

  if (loading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name='arrow-back' size={26} color={theme.colors.background} />
          </TouchableOpacity>

          <Text style={[styles.headerText, { color: theme.colors.background }]}>
            Trip Control
          </Text>

          <View style={{ width: 26 }} />
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loaderText, { color: theme.colors.text }]}>
            Loading trip details...
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.background} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.background }]}>
          Trip Control
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.mapContainer}>
        {locationReady && currentLocation ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            mapType='standard'
            initialRegion={{
              latitude: Number(
                currentLocation?.latitude || DEFAULT_LOCATION.latitude,
              ),
              longitude: Number(
                currentLocation?.longitude || DEFAULT_LOCATION.longitude,
              ),
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            showsScale={true}
            showsBuildings={true}
            showsTraffic={true}
            showsIndoors={true}
            toolbarEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: Number(currentLocation.latitude),
                longitude: Number(currentLocation.longitude),
              }}
              title='Your Current Location'
              description='Driver mobile location'
            >
              <View style={styles.busMarker}>
                <Icon name='bus' size={22} color='#fff' />
              </View>
            </Marker>

            {startingPoint && (
              <Marker
                coordinate={{
                  latitude: startingPoint.latitude,
                  longitude: startingPoint.longitude,
                }}
                title='Route Starting Point'
                description={startingPoint.name}
              >
                <View style={styles.startMarker}>
                  <Icon name='flag' size={18} color='#fff' />
                </View>
              </Marker>
            )}

            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeWidth={4}
                strokeColor={theme.colors.primary || '#175812'}
              />
            )}

            {assignedTrip?.stops?.map((stop, index) => {
              const lat = Number(stop.latitude)
              const lng = Number(stop.longitude)

              if (Number.isNaN(lat) || Number.isNaN(lng)) return null

              return (
                <Marker
                  key={`${stop.stop_name || 'stop'}-${index}`}
                  coordinate={{ latitude: lat, longitude: lng }}
                  title={String(stop.stop_name || `Stop ${index + 1}`)}
                  description={`Stop ${index + 1}`}
                >
                  <View
                    style={[
                      styles.stopMarker,
                      stopStatus.nextStopNumber === index + 1 &&
                        styles.nextStopMapMarker,
                    ]}
                  >
                    {stopStatus.nextStopNumber === index + 1 ? (
                      <Icon name='flag' size={15} color='#fff' />
                    ) : (
                      <Text style={styles.stopMarkerText}>{index + 1}</Text>
                    )}
                  </View>
                </Marker>
              )
            })}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <ActivityIndicator size='large' color={theme.colors.primary} />
            <Text
              style={[styles.mapFallbackText, { color: theme.colors.text }]}
            >
              Preparing map...
            </Text>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.recenterButton}
          onPress={async () => {
            const hasPermission = await requestLocationPermission()
            if (!hasPermission) {
              Alert.alert(
                'Permission Required',
                'Please allow location permission.',
              )
              return
            }

            const location = await getCurrentLocationSafely()
            if (!location) {
              Alert.alert('Location Error', 'Unable to get current location.')
            }
          }}
        >
          <Icon name='locate' size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.colors.box || '#fff',
            borderColor: theme.colors.border || '#E6E8EC',
          },
        ]}
      >
        <View style={styles.dragHandle} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View style={styles.statusRow}>
            <View>
              <Text style={[styles.statusLabel, { color: theme.colors.text }]}>
                Trip Status
              </Text>

              <Text
                style={[
                  styles.statusValue,
                  { color: tripStarted ? '#0A8F3C' : '#D97706' },
                ]}
              >
                {tripStarted ? 'Running Live' : 'Not Started'}
              </Text>
            </View>

            <View
              style={[
                styles.liveBadge,
                { backgroundColor: tripStarted ? '#E8F8EF' : '#FFF7E6' },
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: tripStarted ? '#0A8F3C' : '#D97706' },
                ]}
              />
              <Text
                style={[
                  styles.liveBadgeText,
                  { color: tripStarted ? '#0A8F3C' : '#D97706' },
                ]}
              >
                {tripStarted ? 'LIVE' : 'IDLE'}
              </Text>
            </View>
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerIconBox}>
              <Icon
                name='timer-outline'
                size={24}
                color={theme.colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.timerLabel}>Ride Duration</Text>
              <Text style={[styles.timerValue, { color: theme.colors.text }]}>
                {formatDuration(elapsedSeconds)}
              </Text>
            </View>

            {tripStarted && (
              <View style={styles.trackingPill}>
                <View
                  style={[
                    styles.trackingDot,
                    { backgroundColor: trackingActive ? '#0A8F3C' : '#D97706' },
                  ]}
                />
                <Text
                  style={[
                    styles.trackingText,
                    { color: trackingActive ? '#0A8F3C' : '#D97706' },
                  ]}
                >
                  {trackingActive ? 'GPS Active' : 'GPS Waiting'}
                </Text>
              </View>
            )}
          </View>

          {tripStarted && (
            <View style={styles.nextStopCard}>
              <View style={styles.nextStopTop}>
                <Animated.View
                  style={[
                    styles.nextStopIconCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                      backgroundColor: theme.colors.primary || '#175812',
                    },
                  ]}
                >
                  <Icon name='flag-outline' size={24} color='#fff' />
                </Animated.View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.nextStopSmallLabel}>Next Stop</Text>

                  <Text
                    style={[styles.nextStopName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {stopStatus.nextStop?.name || 'Final stop reached'}
                  </Text>

                  <Text style={styles.nextStopDistance}>
                    {stopStatus.distanceToNextStop !== null
                      ? `${Math.round(
                          stopStatus.distanceToNextStop,
                        )} meters away`
                      : 'Waiting for GPS update'}
                  </Text>
                </View>

                <View style={styles.nextStopBadge}>
                  <Text style={styles.nextStopBadgeText}>
                    {stopStatus.nextStopNumber
                      ? `Stop ${stopStatus.nextStopNumber}`
                      : 'End'}
                  </Text>
                </View>
              </View>

              <View style={styles.animatedRouteBox}>
                <View style={styles.routeMiniDotActive} />

                <View style={styles.animatedRouteLine}>
                  <Animated.View
                    style={[
                      styles.movingMiniBus,
                      {
                        transform: [{ translateX: animatedBusTranslate }],
                      },
                    ]}
                  >
                    <Icon name='bus' size={13} color='#fff' />
                  </Animated.View>
                </View>

                <View style={styles.routeMiniDotNext} />
              </View>

              <View style={styles.currentStopBox}>
                <Icon
                  name='location-outline'
                  size={17}
                  color={theme.colors.primary}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.currentStopLabel}>
                    Nearest Current Stop
                  </Text>

                  <Text
                    style={[
                      styles.currentStopValue,
                      { color: theme.colors.text },
                    ]}
                  >
                    {stopStatus.currentStop?.name ||
                      'Detecting current stop...'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.locationInfoCard}>
            <Icon
              name='navigate-outline'
              size={18}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationInfoLabel}>Last Location Update</Text>
              <Text
                style={[styles.locationInfoValue, { color: theme.colors.text }]}
              >
                {formatLastLocationTime(lastLocationTime)}
              </Text>
            </View>
          </View>

          {distanceFromStart !== null && (
            <View style={styles.locationInfoCard}>
              <Icon
                name='flag-outline'
                size={18}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationInfoLabel}>
                  Distance From Start
                </Text>
                <Text
                  style={[
                    styles.locationInfoValue,
                    { color: theme.colors.text },
                  ]}
                >
                  {Math.round(distanceFromStart)} meters
                </Text>
              </View>
            </View>
          )}

          {assignedTrip ? (
            <>
              <View style={styles.tripCard}>
                <View style={styles.tripIconBox}>
                  <Icon
                    name='bus-outline'
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.busNumber, { color: theme.colors.text }]}
                  >
                    {assignedTrip.bus_number || 'Assigned Bus'}
                  </Text>

                  <Text style={styles.routeName}>
                    {assignedTrip.route_name || 'Assigned Route'}
                  </Text>
                </View>
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routePointRow}>
                  <View style={styles.greenPoint} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routePointLabel}>From</Text>
                    <Text
                      style={[
                        styles.routePointText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {assignedTrip.source || 'Source not available'}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeLine} />

                <View style={styles.routePointRow}>
                  <View style={styles.redPoint} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routePointLabel}>To</Text>
                    <Text
                      style={[
                        styles.routePointText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {assignedTrip.destination || 'Destination not available'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoCard}>
                  <Icon
                    name='time-outline'
                    size={19}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.infoLabel}>Estimated Time</Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.text }]}
                  >
                    {assignedTrip.estimated_time || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Icon
                    name='location-outline'
                    size={19}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.infoLabel}>Stops</Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.text }]}
                  >
                    {assignedTrip?.stops?.length || 0}
                  </Text>
                </View>
              </View>

              {tripStarted ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
                  onPress={endTrip}
                  disabled={endingTrip}
                >
                  {endingTrip ? (
                    <View style={styles.buttonLoaderRow}>
                      <ActivityIndicator color='#fff' size='small' />
                      <Text style={styles.actionButtonText}>
                        Ending Ride...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Icon name='stop-circle-outline' size={22} color='#fff' />
                      <Text style={styles.actionButtonText}>End Ride</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={startTrip}
                  disabled={startingTrip}
                >
                  {startingTrip ? (
                    <View style={styles.buttonLoaderRow}>
                      <ActivityIndicator color='#fff' size='small' />
                      <Text style={styles.actionButtonText}>
                        Checking Location...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Icon name='play-circle-outline' size={22} color='#fff' />
                      <Text style={styles.actionButtonText}>Start Ride</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {!tripStarted && elapsedSeconds > 0 && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.resetButton}
                  onPress={resetRideTimer}
                >
                  <Icon name='refresh-outline' size={18} color='#6B7280' />
                  <Text style={styles.resetButtonText}>Reset Timer</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Icon name='bus-outline' size={42} color='#A1A1AA' />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Assigned Trip
              </Text>
              <Text style={styles.emptyText}>
                No bus or route is assigned to your driver account yet.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default TripControl

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
    fontSize: 14,
    fontWeight: '600',
  },

  mapContainer: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },

  mapFallbackText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  recenterButton: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  busMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#175812',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  startMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  stopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#175812',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopMarkerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#175812',
  },

  bottomSheet: {
    maxHeight: '60%',
    minHeight: 370,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderWidth: 1,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -4 },
  },

  dragHandle: {
    width: 46,
    height: 5,
    borderRadius: 50,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },

  statusValue: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '800',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 50,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  timerCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 14,
  },

  timerIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#EAF6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  timerLabel: {
    fontSize: 12,
    color: '#7A7F89',
    fontWeight: '700',
  },

  timerValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '900',
  },

  trackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  trackingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  trackingText: {
    fontSize: 11,
    fontWeight: '800',
  },

  locationInfoCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 12,
  },

  locationInfoLabel: {
    fontSize: 11,
    color: '#7A7F89',
    fontWeight: '700',
  },

  locationInfoValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
  },

  tripCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  tripIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EAF6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  busNumber: {
    fontSize: 17,
    fontWeight: '800',
  },

  routeName: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  routeBox: {
    marginTop: 14,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  routePointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  greenPoint: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    marginTop: 4,
    marginRight: 12,
  },

  redPoint: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#EF4444',
    marginTop: 4,
    marginRight: 12,
  },

  routeLine: {
    width: 2,
    height: 25,
    backgroundColor: '#CBD5E1',
    marginLeft: 5.5,
    marginVertical: 3,
  },

  routePointLabel: {
    fontSize: 12,
    color: '#8A8F98',
    fontWeight: '600',
  },

  routePointText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
  },

  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },

  infoCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    padding: 12,
  },

  infoLabel: {
    marginTop: 6,
    fontSize: 11,
    color: '#7A7F89',
    fontWeight: '600',
  },

  infoValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
  },

  actionButton: {
    marginTop: 18,
    height: 54,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  buttonLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  resetButton: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '800',
  },

  emptyCard: {
    marginTop: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '800',
  },

  emptyText: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  nextStopCard: {
    marginTop: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 15,
    overflow: 'hidden',
  },

  nextStopTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nextStopIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  nextStopSmallLabel: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  nextStopName: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: '900',
  },

  nextStopDistance: {
    marginTop: 3,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },

  nextStopBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  nextStopBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#166534',
  },

  animatedRouteBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  routeMiniDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },

  routeMiniDotNext: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F97316',
  },

  animatedRouteLine: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#BBF7D0',
    marginHorizontal: 8,
    justifyContent: 'center',
  },

  movingMiniBus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#175812',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    elevation: 3,
  },

  currentStopBox: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    padding: 12,
  },

  currentStopLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },

  currentStopValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '900',
  },

  nextStopMapMarker: {
    backgroundColor: '#F97316',
    borderColor: '#fff',
  },
})
