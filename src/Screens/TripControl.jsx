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
} from 'react-native'
import React, { useContext, useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'
import MapView, { Marker, Polyline } from 'react-native-maps'
import Geolocation from 'react-native-geolocation-service'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'

const TripControl = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const [locationReady, setLocationReady] = useState(false)
  const mapRef = useRef(null)
  const watchIdRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [startingTrip, setStartingTrip] = useState(false)
  const [endingTrip, setEndingTrip] = useState(false)

  const [driverData, setDriverData] = useState(null)
  const [tripStarted, setTripStarted] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)

  const [assignedTrip, setAssignedTrip] = useState(null)

  useEffect(() => {
    initializeScreen()

    return () => {
      stopLocationWatch()
    }
  }, [])

  const initializeScreen = async () => {
    setLoading(true)

    try {
      const hasPermission = await requestLocationPermission()

      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to start trip tracking.',
        )
        return
      }

      const userString = await AsyncStorage.getItem('user')
      const user = userString ? JSON.parse(userString) : null

      console.log('Driver user from AsyncStorage:', user)

      setDriverData(user)

      await getCurrentLocation()

      await fetchAssignedTrip(user)
    } catch (error) {
      console.log('Trip control init error:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse')
      return auth === 'granted'
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message:
          'UOL Transportation App needs your location to track the running bus.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    )

    return granted === PermissionsAndroid.RESULTS.GRANTED
  }

  const getDriverId = user => {
    return user?.driver_id || user?.id || user?.user_id || user?.userId
  }

  const fetchAssignedTrip = async user => {
    try {
      const driverId = getDriverId(user)

      console.log('Driver ID for assigned trip:', driverId)

      if (!driverId) {
        console.log('Driver ID not found in AsyncStorage user:', user)
        setAssignedTrip(null)
        return
      }

      const url = `${BASE_URL}/driver/my-route/${driverId}`
      console.log('Driver route API URL:', url)

      const response = await fetch(url)
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
          stops: data.route?.stops || [],
        }

        setAssignedTrip(formattedTrip)

        if (formattedTrip.status === 'running') {
          setTripStarted(true)
          startLocationWatch(formattedTrip)
        }
      } else {
        console.log('No assigned route found:', json?.message)
        setAssignedTrip(null)
      }
    } catch (error) {
      console.log('Fetch assigned trip error:', error)
      setAssignedTrip(null)
    }
  }

  const getCurrentLocation = () => {
    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          const location = {
            latitude: Number(position.coords.latitude),
            longitude: Number(position.coords.longitude),
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }

          setCurrentLocation(location)
          setLocationReady(true)

          setTimeout(() => {
            mapRef.current?.animateToRegion(location, 1000)
          }, 800)

          resolve(location)
        },
        error => {
          console.log('Current location error:', error)

          const fallbackLocation = {
            latitude: 31.5204,
            longitude: 74.3587,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }

          setCurrentLocation(fallbackLocation)
          setLocationReady(true)

          resolve(fallbackLocation)
        },
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 10000,
        },
      )
    })
  }

  const startTrip = async () => {
    try {
      if (!assignedTrip) {
        Alert.alert('No Assigned Trip', 'No bus or route is assigned to you.')
        return
      }

      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Please allow location permission.')
        return
      }

      setStartingTrip(true)

      const driverId = getDriverId(driverData)
      const location = await getCurrentLocation()

      if (!location) {
        Alert.alert('Location Error', 'Unable to get your current location.')
        return
      }

      /*
        Expected backend API:
        POST /start-trip

        Body:
        {
          driver_id,
          bus_id,
          route_id,
          latitude,
          longitude
        }
      */

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
        startLocationWatch(assignedTrip)
        Alert.alert('Trip Started', 'Your bus is now live for tracking.')
      } else {
        Alert.alert('Error', json?.message || 'Unable to start trip.')
      }
    } catch (error) {
      console.log('Start trip error:', error)
      Alert.alert('Error', 'Something went wrong while starting trip.')
    } finally {
      setStartingTrip(false)
    }
  }

  const endTrip = async () => {
    try {
      setEndingTrip(true)

      const driverId = getDriverId(driverData)

      /*
        Expected backend API:
        POST /end-trip

        Body:
        {
          driver_id,
          bus_id,
          route_id
        }
      */

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
        stopLocationWatch()
        setTripStarted(false)
        Alert.alert('Trip Ended', 'Live tracking has been stopped.')
      } else {
        Alert.alert('Error', json?.message || 'Unable to end trip.')
      }
    } catch (error) {
      console.log('End trip error:', error)
      Alert.alert('Error', 'Something went wrong while ending trip.')
    } finally {
      setEndingTrip(false)
    }
  }

  const startLocationWatch = trip => {
    stopLocationWatch()

    watchIdRef.current = Geolocation.watchPosition(
      position => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }

        setCurrentLocation(location)

        sendLiveLocationToBackend(location, trip)

        mapRef.current?.animateToRegion(location, 700)
      },
      error => {
        console.log('Watch location error:', error)
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 3000,
        showsBackgroundLocationIndicator: true,
      },
    )
  }

  const stopLocationWatch = () => {
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const sendLiveLocationToBackend = async (location, trip) => {
    try {
      const driverId = getDriverId(driverData)

      /*
        Expected backend API:
        POST /update-bus-location

        Body:
        {
          driver_id,
          bus_id,
          route_id,
          latitude,
          longitude,
          status: "running"
        }

        This API should update latest bus location in MySQL.
        Student side will fetch only his assigned bus.
        Admin side will fetch all running buses.
      */

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

  const buildRouteCoordinates = () => {
    if (!assignedTrip?.stops || !Array.isArray(assignedTrip.stops)) {
      return []
    }

    return assignedTrip.stops
      .filter(stop => stop.latitude && stop.longitude)
      .sort(
        (a, b) =>
          Number(a.stop_order || a.order || 0) -
          Number(b.stop_order || b.order || 0),
      )
      .map(stop => ({
        latitude: Number(stop.latitude),
        longitude: Number(stop.longitude),
      }))
  }

  const routeCoordinates = buildRouteCoordinates()

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
      {/* HEADER */}
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
            style={styles.map}
            initialRegion={currentLocation}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title='Your Bus'
                description='Live driver location'
              >
                <View style={styles.busMarker}>
                  <Icon name='bus' size={22} color='#fff' />
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

              if (!lat || !lng) return null

              return (
                <Marker
                  key={`${stop.stop_name}-${index}`}
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={String(stop.stop_name || `Stop ${index + 1}`)}
                  description={`Stop ${index + 1}`}
                >
                  <View style={styles.stopMarker}>
                    <Text style={styles.stopMarkerText}>{index + 1}</Text>
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
          onPress={() => {
            if (currentLocation) {
              mapRef.current?.animateToRegion(currentLocation, 800)
            } else {
              getCurrentLocation()
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
          contentContainerStyle={{ paddingBottom: 10 }}
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
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <>
                      <Icon name='stop-circle-outline' size={22} color='#fff' />
                      <Text style={styles.actionButtonText}>End Trip</Text>
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
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <>
                      <Icon name='play-circle-outline' size={22} color='#fff' />
                      <Text style={styles.actionButtonText}>Start Trip</Text>
                    </>
                  )}
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
    maxHeight: '48%',
    minHeight: 310,
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

  tripCard: {
    marginTop: 18,
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
})
