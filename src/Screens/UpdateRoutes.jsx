import React, { useEffect, useState, useContext, useRef } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL, endPoints } from '../services/baseUrl'

const UpdateRoutes = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const mapRef = useRef(null)

  const [routes, setRoutes] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)

  const [routeName, setRouteName] = useState('')
  const [source, setSource] = useState('')
  const [destination, setDestination] = useState('')
  const [time, setTime] = useState('')
  const [stops, setStops] = useState([])

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchRoutes()
  }, [])

  useEffect(() => {
    autoCalculateTime()
    autoSetSourceDestination()
  }, [stops])

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${BASE_URL}/${endPoints.routesWithStops}`)
      const data = await res.json()
      setRoutes(data)
    } catch (err) {
      Alert.alert('Error', 'Failed to load routes')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectRoute = route => {
    setSelectedRoute(route)
    setRouteName(route.route_name)
    setSource(route.source)
    setDestination(route.destination)
    setTime(route.estimated_time)
    setStops(route.stops || [])

    if (route.stops?.length > 0) {
      mapRef.current?.animateToRegion({
        latitude: Number(route.stops[0].latitude),
        longitude: Number(route.stops[0].longitude),
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      })
    }
  }

  const addStop = location => {
    const exists = stops.some(
      s =>
        Math.abs(Number(s.latitude) - Number(location.latitude)) < 0.0001 &&
        Math.abs(Number(s.longitude) - Number(location.longitude)) < 0.0001,
    )

    if (exists) {
      Alert.alert('Already Added', 'This stop already exists in route')
      return
    }

    setStops(prev => [
      ...prev,
      {
        stop_name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      },
    ])

    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  }

  const removeStop = index => {
    Alert.alert('Remove Stop', 'Are you sure you want to remove this stop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setStops(prev => prev.filter((_, i) => i !== index))
        },
      },
    ])
  }

  const moveUp = index => {
    if (index === 0) return

    const updated = [...stops]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setStops(updated)
  }

  const moveDown = index => {
    if (index === stops.length - 1) return

    const updated = [...stops]
    ;[updated[index + 1], updated[index]] = [updated[index], updated[index + 1]]
    setStops(updated)
  }

  const autoSetSourceDestination = () => {
    if (stops.length > 0) {
      setSource(stops[0].stop_name)
      setDestination(stops[stops.length - 1].stop_name)
    }
  }

  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const autoCalculateTime = () => {
    if (stops.length < 2) {
      setTime('')
      return
    }

    let totalDistance = 0

    for (let i = 0; i < stops.length - 1; i++) {
      totalDistance += getDistanceInKm(
        Number(stops[i].latitude),
        Number(stops[i].longitude),
        Number(stops[i + 1].latitude),
        Number(stops[i + 1].longitude),
      )
    }

    const avgSpeed = 30
    const travelTimeMinutes = (totalDistance / avgSpeed) * 60
    const stopDelay = (stops.length - 1) * 5
    const totalTime = Math.round(travelTimeMinutes + stopDelay)

    setTime(`${totalTime} mins`)
  }

  const handleUpdateRoute = async () => {
    if (!selectedRoute) {
      Alert.alert('Error', 'Please select a route first')
      return
    }

    if (!routeName || !source || !destination || stops.length < 2) {
      Alert.alert('Error', 'Route name and at least 2 stops are required')
      return
    }

    setUpdating(true)

    try {
      const res = await fetch(
        `${BASE_URL}/${endPoints.updateRoute}/${selectedRoute.id}`,
        {
          method: 'PUT',
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
        },
      )

      const data = await res.json()

      if (res.ok) {
        Alert.alert('Success', data.message || 'Route updated successfully')
        fetchRoutes()
      } else {
        Alert.alert('Error', data.message || 'Update failed')
      }
    } catch (err) {
      Alert.alert('Error', 'Server error')
    } finally {
      setUpdating(false)
    }
  }

  const addStopFromMapTap = event => {
    const { latitude, longitude } = event.nativeEvent.coordinate

    const newStopNumber = stops.length + 1

    addStop({
      name: `Stop ${newStopNumber}`,
      latitude,
      longitude,
    })
  }

  const polylineCoords = stops.map(stop => ({
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude),
  }))

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='#fff' />
        </TouchableOpacity>

        <Text style={styles.headerText}>Update Route</Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps='handled'
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Select Route
          </Text>

          {routes.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.routeCard,
                {
                  borderColor:
                    selectedRoute?.id === item.id
                      ? theme.colors.primary
                      : '#e5e7eb',
                  backgroundColor:
                    selectedRoute?.id === item.id ? '#eefaf4' : '#fff',
                },
              ]}
              onPress={() => handleSelectRoute(item)}
            >
              <View style={styles.routeHeader}>
                <Text style={styles.routeTitle}>🛣️ {item.route_name}</Text>

                {selectedRoute?.id === item.id && (
                  <Icon
                    name='checkmark-circle'
                    size={22}
                    color={theme.colors.primary}
                  />
                )}
              </View>

              <View style={styles.routeFlow}>
                <View style={styles.locationBox}>
                  <Icon name='location' size={16} color='#2ecc71' />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {item.source}
                  </Text>
                </View>

                <Icon
                  name='swap-horizontal-outline'
                  size={22}
                  color={theme.colors.primary}
                  style={{ marginHorizontal: 10 }}
                />

                <View style={styles.locationBox}>
                  <Icon name='flag-outline' size={16} color='#e74c3c' />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {item.destination}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>🕒 {item.estimated_time}</Text>
                <Text style={styles.metaChip}>
                  📍 {item.stops?.length || 0} Stops
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {selectedRoute && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Edit Route Details
              </Text>

              <TextInput
                placeholder='Route Name'
                value={routeName}
                onChangeText={setRouteName}
                style={styles.input}
              />

              <View style={styles.previewCard}>
                <View style={styles.locationBox}>
                  <Icon name='location' size={16} color='#2ecc71' />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {source || 'Source'}
                  </Text>
                </View>

                <Icon
                  name='swap-horizontal-outline'
                  size={22}
                  color={theme.colors.primary}
                  style={{ marginHorizontal: 10 }}
                />

                <View style={styles.locationBox}>
                  <Icon name='flag-outline' size={16} color='#e74c3c' />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {destination || 'Destination'}
                  </Text>
                </View>
              </View>

              <TextInput
                placeholder='Estimated Time'
                value={time}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Add New Stop
              </Text>

              {/* <View style={styles.searchWrapper}>
                <GooglePlacesAutocomplete
                  key={selectedRoute?.id || 'default'}
                  placeholder="Search stop location"
                  fetchDetails={true}
                  listViewDisplayed="auto"
                  predefinedPlaces={[]}
                  textInputProps={{
                    onFocus: () => {},
                    onBlur: () => {},
                  }}
                  onPress={(data, details = null) => {
                    if (!details) return;

                    addStop({
                      name: data.description,
                      latitude: details.geometry.location.lat,
                      longitude: details.geometry.location.lng,
                    });
                  }}
                  query={{
                    key: GOOGLE_API_KEY,
                    language: 'en',
                  }}
                  enablePoweredByContainer={false}
                  debounce={300}
                  styles={{
                    textInput: styles.searchInput,
                    container: { flex: 0 },
                    listView: styles.searchDropdown,
                  }}
                />

                <View style={styles.searchIcon}>
                  <Icon name="search" size={18} color="#666" />
                </View>
              </View> */}

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Route Preview
              </Text>
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
                <Text
                  style={[styles.tapHintText, { color: theme.colors.text }]}
                >
                  Tap anywhere on the map to add a new stop
                </Text>
              </View>
              <MapView
                provider={PROVIDER_GOOGLE}
                ref={mapRef}
                style={styles.map}
                mapType='standard'
                showsUserLocation={true}
                showsMyLocationButton={true}
                onPress={addStopFromMapTap}
                initialRegion={{
                  latitude: Number(stops[0]?.latitude || 31.5204),
                  longitude: Number(stops[0]?.longitude || 74.3587),
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                {stops.map((stop, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: Number(stop.latitude),
                      longitude: Number(stop.longitude),
                    }}
                    title={stop.stop_name}
                    pinColor={
                      index === 0
                        ? 'green'
                        : index === stops.length - 1
                        ? 'red'
                        : 'blue'
                    }
                  />
                ))}

                {polylineCoords.length >= 2 && (
                  <Polyline
                    coordinates={polylineCoords}
                    strokeWidth={4}
                    strokeColor={theme.colors.primary}
                  />
                )}
              </MapView>

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Manage Stops
              </Text>

              {stops.map((stop, index) => (
                <View
                  key={index}
                  style={[
                    styles.stopCard,
                    { backgroundColor: theme.colors.dashboard },
                  ]}
                >
                  <View style={styles.stopIndex}>
                    <Text style={styles.stopIndexText}>{index + 1}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={[styles.stopName, { color: theme.colors.text }]}
                    >
                      {index === 0
                        ? '🏫 '
                        : index === stops.length - 1
                        ? '🏁 '
                        : '📍 '}
                      {stop.stop_name}
                    </Text>

                    <Text style={[styles.coords, { color: theme.colors.text }]}>
                      {stop.latitude}, {stop.longitude}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    {index > 0 && (
                      <TouchableOpacity onPress={() => moveUp(index)}>
                        <Icon name='arrow-up-circle' size={22} color='#555' />
                      </TouchableOpacity>
                    )}

                    {index < stops.length - 1 && (
                      <TouchableOpacity onPress={() => moveDown(index)}>
                        <Icon name='arrow-down-circle' size={22} color='#555' />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity onPress={() => removeStop(index)}>
                      <Icon name='trash' size={22} color='#e74c3c' />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                disabled={updating}
                style={[
                  styles.updateBtn,
                  {
                    backgroundColor: updating ? '#999' : theme.colors.primary,
                  },
                ]}
                onPress={handleUpdateRoute}
              >
                <Text style={styles.updateText}>
                  {updating ? 'Updating...' : 'Update Route'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default UpdateRoutes

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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  content: {
    padding: 15,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 14,
  },

  routeCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
  },

  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  routeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    flex: 1,
  },

  routeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '42%',
    gap: 5,
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },

  metaChip: {
    backgroundColor: '#f1f3f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    color: '#555',
    fontSize: 12,
    overflow: 'hidden',
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 13,
    borderRadius: 14,
    marginBottom: 10,
    color: '#111',
  },

  disabledInput: {
    backgroundColor: '#f1f3f6',
    color: '#555',
  },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 13,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  searchWrapper: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 1000,
  },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingLeft: 40,
    height: 48,
    fontSize: 14,
    elevation: 5,
  },

  searchIcon: {
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

  map: {
    height: 230,
    borderRadius: 16,
    marginBottom: 12,
  },

  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
  },

  stopIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2ecc71',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  stopIndexText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },

  coords: {
    fontSize: 10,
    color: '#777',
    marginTop: 3,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },

  updateBtn: {
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 16,
  },

  updateText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  tapHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  tapHintText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
})
