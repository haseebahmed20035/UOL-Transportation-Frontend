import React, { useState, useContext, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import { ThemeContext } from '../context/ThemeContext'
import Icon from 'react-native-vector-icons/Ionicons'
import { useEffect } from 'react'
import { PermissionsAndroid, Platform } from 'react-native'
import Geolocation from '@react-native-community/geolocation'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BASE_URL, endPoints } from '../services/baseUrl'

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
})
const AddRoutes = ({ navigation }) => {
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        )

        return granted === PermissionsAndroid.RESULTS.GRANTED
      } catch (err) {
        console.warn(err)
        return false
      }
    }

    return true
  }
  const moveToCurrentLocation = async () => {
  const granted = await requestLocationPermission()

  if (!granted) {
    Alert.alert('Permission Denied', 'Location permission is required')
    return
  }

  // 🔥 STEP 1: Get a quick, low-accuracy location instantly (network/cached)
  Geolocation.getCurrentPosition(
    position => {
      const { latitude, longitude } = position.coords
      console.log('FAST LOCATION:', latitude, longitude)

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500,
      )

      // 🔥 STEP 2: Then get accurate GPS in background and refine
      Geolocation.getCurrentPosition(
        accuratePos => {
          const { latitude: lat, longitude: lng } = accuratePos.coords
          console.log('ACCURATE LOCATION:', lat, lng)

          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            800,
          )
        },
        err => {
          console.log('Accurate location failed (using fast one):', err.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      )
    },
    error => {
      console.log('Fast location failed:', error)

      // 🔥 If even fast location fails, try high-accuracy as a last resort
      Geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000,
          )
        },
        err => {
          Alert.alert(
            'Location Error',
            err.message || 'Unable to fetch location',
          )
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      )
    },
    {
      enableHighAccuracy: false, // 🔥 KEY: use network-based location for speed
      timeout: 5000,
      maximumAge: 60000, // 🔥 accept location up to 1 minute old
    },
  )
}

  const mapRef = useRef(null)
  const { theme } = useContext(ThemeContext)
  const [routeName, setRouteName] = useState('')
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState('')

  const [stops, setStops] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)

  const [loading, setLoading] = useState(false)

  // 🔥 MAP CLICK
 const handleMapPress = async e => {
  const { latitude, longitude } = e.nativeEvent.coordinate
  const stopId = Date.now() + Math.random()

  const tempStop = {
    id: stopId,
    stop_name: 'Loading address...',
    latitude,
    longitude,
  }

  setStops(prev => [...prev, tempStop])

  mapRef.current?.animateToRegion({
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  })

  const updateStopName = name => {
    setStops(prev =>
      prev.map(s => (s.id === stopId ? { ...s, stop_name: name } : s)),
    )
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UOL-Transport-App/1.0',
          'Accept-Language': 'en',
        },
      },
    )

    const data = await res.json()
    console.log('NOMINATIM RESPONSE:', JSON.stringify(data, null, 2))

    const addr = data.address || {}

    // 🔥 Try to extract the most meaningful name
    const road =
      addr.road ||
      addr.pedestrian ||
      addr.footway ||
      addr.path ||
      addr.cycleway ||
      addr.highway

    const area =
      addr.neighbourhood ||
      addr.suburb ||
      addr.residential ||
      addr.quarter ||
      addr.city_district ||
      addr.hamlet ||
      addr.village

    const city = addr.city || addr.town || addr.municipality || addr.county

    let stopName = null

    if (road && area) {
      stopName = `${road}, ${area}`
    } else if (road && city) {
      stopName = `${road}, ${city}`
    } else if (road) {
      stopName = road
    } else if (area && city) {
      stopName = `${area}, ${city}`
    } else if (area) {
      stopName = area
    } else if (city) {
      stopName = city
    } else if (data.display_name) {
      // Fallback: first 2 parts of full address
      stopName = data.display_name.split(',').slice(0, 2).join(',').trim()
    } else {
      stopName = 'Unnamed Stop'
    }

    console.log('PICKED STOP NAME:', stopName)
    updateStopName(stopName)
  } catch (err) {
    console.log('NOMINATIM ERROR:', err)
    updateStopName('Unnamed Stop')
  }
}

  // 🔥 ADD STOP
  const handleAddStop = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Tap on map first')
      return
    }

    setStops(prev => [
      ...prev,
      {
        stop_name: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
    ])

    setSelectedLocation(null)
  }

  // 🔥 REMOVE STOP
  const removeStop = index => {
    setStops(stops.filter((_, i) => i !== index))
  }

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!source || !destination || stops.length === 0) {
      Alert.alert('Error', 'Fill all fields and add stops')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${BASE_URL}/${endPoints.addRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_name: routeName,
          source,
          destination,
          estimated_time: time,
          stops,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        Alert.alert('Success', data.message)
        setRouteName('')
        setSource('')
        setDestination('')
        setTime('')
        setStops([])
      } else {
        Alert.alert('Error', data.message)
      }
    } catch (err) {
      Alert.alert('Error', 'Server error')
    }

    setLoading(false)
  }
  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // km
  }
  const calculateEstimatedTime = () => {
    if (stops.length < 2) return

    let totalDistance = 0

    for (let i = 0; i < stops.length - 1; i++) {
      const s1 = stops[i]
      const s2 = stops[i + 1]

      totalDistance += getDistanceInKm(
        s1.latitude,
        s1.longitude,
        s2.latitude,
        s2.longitude,
      )
    }

    // 🚌 assume avg speed = 30 km/h (city traffic)
    const travelTimeMinutes = (totalDistance / 30) * 60

    // ⏱️ stop delay (5 min each)
    const stopDelay = (stops.length - 1) * 5

    const totalTime = Math.round(travelTimeMinutes + stopDelay)

    setTime(`${totalTime} mins`)
  }
  useEffect(() => {
    calculateEstimatedTime()
  }, [stops])

  useEffect(() => {
    if (stops.length > 0) {
    }
  }, [stops])
  useEffect(() => {
    requestLocationPermission()
  }, [])
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* HEADER */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name='arrow-back' size={26} color='#fff' />
          </TouchableOpacity>

          <Text style={styles.headerText}>Add Route</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 15 }}>
          {/* INPUTS */}
          <TextInput
            placeholder='Route Name (e.g. Johar Town Route)'
            value={routeName}
            onChangeText={setRouteName}
            style={styles.input}
          />
          <TextInput
            placeholder='Source'
            value={source}
            onChangeText={setSource}
            style={styles.input}
          />

          <TextInput
            placeholder='Destination'
            value={destination}
            onChangeText={setDestination}
            style={styles.input}
          />

          {/* 🔥 ROUTE PREVIEW */}
          {source && destination && (
            <View style={styles.routePreview}>
              <View style={styles.locationBox}>
                <Icon name='location' size={16} color='#2ecc71' />
                <Text style={styles.locationText}>{source}</Text>
              </View>

              <Icon
                name='swap-horizontal-outline'
                size={22}
                color={theme.colors.primary}
                style={{ marginHorizontal: 10 }}
              />

              <View style={styles.locationBox}>
                <Icon name='flag-outline' size={16} color='#e74c3c' />
                <Text style={styles.locationText}>{destination}</Text>
              </View>
            </View>
          )}

          <TextInput
            placeholder='Estimated Time'
            value={time}
            editable={false}
            style={[styles.input, { backgroundColor: '#f1f3f6' }]}
          />

          {/* MAP */}
          <View
            style={[
              styles.tapHintCard,
              { backgroundColor: theme.colors.dashboard },
            ]}
          >
            <Icon
              name='information-circle-outline'
              size={18}
              color={theme.colors.icon}
            />
            <Text style={[styles.tapHintText, { color: theme.colors.text }]}>
              Tap anywhere on the map to add a new stop
            </Text>
          </View>
          <View style={{ position: 'relative' }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              ref={mapRef}
              style={styles.map}
              showsUserLocation={true}
              followsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              onPress={handleMapPress}
            >
              {selectedLocation && <Marker coordinate={selectedLocation} />}

              {/* ALL STOPS */}
              {stops.map((s, i) => (
                <Marker
                  key={i}
                  coordinate={{
                    latitude: parseFloat(s.latitude),
                    longitude: parseFloat(s.longitude),
                  }}
                  title={s.stop_name}
                  pinColor='blue'
                />
              ))}
            </MapView>
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={moveToCurrentLocation}
            >
              <Icon name='locate' size={24} color='#fff' />
            </TouchableOpacity>
          </View>
          {/* SELECTED */}
          {selectedLocation && (
            <View style={styles.selectedBox}>
              <Text style={{ marginBottom: 5 }}>{selectedLocation.name}</Text>

              <TouchableOpacity style={styles.addBtn} onPress={handleAddStop}>
                <Text style={{ color: '#fff' }}>Add Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STOP LIST */}
          {stops.map((stop, index) => (
            <View key={index} style={styles.stopCard}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1}>{stop.stop_name}</Text>
                <Text style={{ fontSize: 12 }}>
                  {stop.latitude}, {stop.longitude}
                </Text>
              </View>

              <TouchableOpacity onPress={() => removeStop(index)}>
                <Icon name='trash' size={18} color='red' />
              </TouchableOpacity>
            </View>
          ))}

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Save Route'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaProvider>
  )
}

export default AddRoutes

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  section: {
    fontWeight: 'bold',
    marginTop: 10,
  },

  map: {
    height: 260,
    marginVertical: 10,
    borderRadius: 12,
  },

  selectedBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },

  submitBtn: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 12,
  },

  searchIcon: {
    marginRight: 6,
  },

  searchInput: {
    fontSize: 14,
    color: '#000',
    backgroundColor: 'transparent',
  },

  searchList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 1000,
  },

  searchInputModern: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingLeft: 40,
    height: 48,
    fontSize: 14,
    elevation: 5,
  },

  searchIconModern: {
    position: 'absolute',
    left: 12,
    top: 14,
  },

  searchDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    elevation: 6,
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '40%',
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  locationBtn: {
    position: 'absolute',
    right: 15,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  tapHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    marginBottom: '-2',
    marginTop: 7,
  },

  tapHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
})
