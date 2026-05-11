import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeContext } from '../context/ThemeContext'

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'

const RequestForTransport = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    try {
      const response = await fetch(
        'http://192.168.100.100:5000/routes-with-stops',
      )

      const json = await response.json()

      setRoutes(json)
    } catch (e) {
      console.log(e)
      Alert.alert('Error', 'Failed to load routes')
    }

    setLoading(false)
  }

  const selectRoute = async route => {
    try {
      const studentId = await AsyncStorage.getItem('studentId')

      console.log('Student ID:', studentId)
      console.log('Route ID:', route.id)

      if (!studentId) {
        Alert.alert('Error', 'Student ID not found')
        return
      }

      const response = await fetch(
        'http://192.168.100.100:5000/request-transport',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: Number(studentId),
            route_id: Number(route.id),
          }),
        },
      )

      const json = await response.json()

      console.log(json)

      if (!response.ok) {
        Alert.alert('Error', json.message)
        return
      }

      Alert.alert('Success', json.message)

      navigation.goBack()
    } catch (e) {
      console.log(e)

      Alert.alert('Error', 'Failed to send request')
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size='large' color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.background} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            {
              color: theme.colors.background,
            },
          ]}
        >
          Request Transport
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
            },
          ]}
        >
          Available Routes
        </Text>

        {routes.map((route, index) => (
          <View
           key={route.id}
            style={[
              styles.routeCard,
              {
                backgroundColor: theme.colors.box,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {/* TOP */}
            <View style={styles.topRow}>
              <View style={styles.routeLeft}>
                <View
                  style={[
                    styles.busIconContainer,
                    {
                      backgroundColor: theme.colors.primary + '20',
                    },
                  ]}
                >
                  <Icon name='bus' size={24} color={theme.colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.routeName,
                      {
                        color: theme.colors.text,
                      },
                    ]}
                  >
                    {route.route_name}
                  </Text>

                  <Text
                    style={[
                      styles.routePath,
                      {
                        color: theme.colors.subtext,
                      },
                    ]}
                  >
                    {route.source} → {route.destination}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.timeBadge,
                  {
                    backgroundColor: theme.colors.primary + '15',
                  },
                ]}
              >
                <Icon
                  name='time-outline'
                  size={14}
                  color={theme.colors.primary}
                />

                <Text
                  style={[
                    styles.timeText,
                    {
                      color: theme.colors.primary,
                    },
                  ]}
                >
                  {route.estimated_time}
                </Text>
              </View>
            </View>

            {/* MAP */}
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}
                rotateEnabled={true}
                showsCompass={true}
                showsScale={true}
                initialRegion={{
                  latitude: Number(route.stops?.[0]?.latitude) || 31.5204,
                  longitude: Number(route.stops?.[0]?.longitude) || 74.3587,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
              >
                {/* POLYLINE */}
                <Polyline
                  coordinates={
                    route.stops
                      ?.filter(
                        stop =>
                          !isNaN(parseFloat(stop.latitude)) &&
                          !isNaN(parseFloat(stop.longitude)),
                      )
                      .map(stop => ({
                        latitude: parseFloat(stop.latitude),
                        longitude: parseFloat(stop.longitude),
                      })) || []
                  }
                  strokeWidth={4}
                  strokeColor={theme.colors.primary}
                />

                {/* MARKERS */}
                {route.stops?.map((stop, i) => {
                  const lat = parseFloat(stop.latitude)
                  const lng = parseFloat(stop.longitude)

                  if (isNaN(lat) || isNaN(lng)) return null

                  return (
                    <Marker
                      key={i}
                      coordinate={{
                        latitude: lat,
                        longitude: lng,
                      }}
                      title={stop.stop_name}
                      description={`Stop ${i + 1}`}
                      pinColor='red'
                    />
                  )
                })}
              </MapView>
            </View>

            {/* STOPS */}
            <View style={styles.stopsContainer}>
              <Text
                style={[
                  styles.stopTitle,
                  {
                    color: theme.colors.text,
                  },
                ]}
              >
                Route Stops
              </Text>

              <View style={styles.stopWrap}>
                {route.stops?.map((stop, i) => (
                  <View
                    key={i}
                    style={[
                      styles.stopChip,
                      {
                        backgroundColor: theme.colors.option,
                      },
                    ]}
                  >
                    <Icon
                      name='location'
                      size={12}
                      color={theme.colors.primary}
                    />

                    <Text
                      style={[
                        styles.stopText,
                        {
                          color: theme.colors.text,
                        },
                      ]}
                    >
                      {stop.stop_name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* BOTTOM */}
            <View style={styles.bottomRow}>
              <Text
                style={[
                  styles.stopCount,
                  {
                    color: theme.colors.subtext,
                  },
                ]}
              >
                {route.stops?.length || 0} Stops
              </Text>

              <View
                style={[
                  styles.requestBtn,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.9}
                  onPress={() => selectRoute(route)}
                >
                  <Text style={styles.requestBtnText}>Request Route</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default RequestForTransport

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    elevation: 5,
  },

  headerText: {
    fontSize: 19,
    fontWeight: '700',
  },

  body: {
    padding: 16,
    paddingBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 18,
  },

  routeCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    elevation: 3,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  routeLeft: {
    flexDirection: 'row',
    flex: 1,
  },

  busIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  routeName: {
    fontSize: 17,
    fontWeight: '700',
  },

  routePath: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },

  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },

  timeText: {
    fontWeight: '700',
    fontSize: 12,
  },

  mapContainer: {
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
  },

  map: {
    width: '100%',
    height: 180,
  },

  stopsContainer: {
    marginTop: 18,
  },

  stopTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  stopWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 5,
  },

  stopText: {
    fontSize: 12,
    fontWeight: '600',
  },

  bottomRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  stopCount: {
    fontSize: 13,
    fontWeight: '600',
  },

  requestBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
  },

  requestBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
})
