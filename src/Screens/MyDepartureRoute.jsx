import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { ThemeContext } from '../context/ThemeContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MyDepartureRoute = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [todayRoute, setTodayRoute] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartureRoute()
  }, [])

  const fetchDepartureRoute = async () => {
    try {
      const studentId = await AsyncStorage.getItem('studentId')

      const response = await fetch(
        `http://192.168.100.100:5000/student-departure-route/${studentId}`,
      )

      const json = await response.json()

      console.log(json)

      setTodayRoute(json)
    } catch (e) {
      console.log(e)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>Loading...</Text>
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
          <Icon name='arrow-back' size={26} color='white' />
        </TouchableOpacity>

        <Text style={styles.headerText}>My Departure Route</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ROUTE SUMMARY */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.option },
          ]}
        >
          {!todayRoute ? (
            <Text style={[styles.noBusText, { color: theme.colors.text }]}>
              No bus service available today
            </Text>
          ) : (
            <>
              <Text style={[styles.routeName, { color: theme.colors.text }]}>
                Today’s Route (
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                })}
                )
              </Text>

              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 15,
                  fontWeight: '600',
                  marginBottom: 12,
                }}
              >
                {todayRoute.route_name}
              </Text>

              <View style={styles.infoRow}>
                <Icon
                  name='navigate-outline'
                  size={18}
                  color={theme.colors.icon}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {todayRoute.source} → {todayRoute.destination}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon
                  name='bus-outline'
                  size={18}
                  color={theme.colors.icon}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Bus No: {todayRoute.bus_number}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon
                  name='time-outline'
                  size={18}
                  color={theme.colors.icon}
                />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Estimated Arrival: {todayRoute.estimated_time}
                </Text>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              <Text
                style={[
                  styles.subTitle,
                  { color: theme.colors.text },
                ]}
              >
                Departure Timings
              </Text>

              {todayRoute.timings?.map((item, index) => (
                <View key={index} style={styles.infoRow}>
                  <Icon
                    name='time-outline'
                    size={18}
                    color={theme.colors.icon}
                  />

                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {item.departure_time}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ROUTE STOPS */}
        {todayRoute && (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Route Stops
            </Text>

            {todayRoute.stops.map((stop, index) => (
              <View key={index} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: theme.colors.icon },
                    ]}
                  />

                  {index !== todayRoute.stops.length - 1 && (
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: theme.colors.icon },
                      ]}
                    />
                  )}
                </View>

                <Text style={[styles.stopText, { color: theme.colors.text }]}>
                  {stop.stop_name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* MAP */}
        {todayRoute && (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Route Map
            </Text>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: Number(todayRoute.stops[0].latitude),
                longitude: Number(todayRoute.stops[0].longitude),
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
              }}
            >
              {todayRoute.stops.map((stop, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: Number(stop.latitude),
                    longitude: Number(stop.longitude),
                  }}
                  title={stop.stop_name}
                  pinColor='red'
                />
              ))}

              <Polyline
                coordinates={todayRoute.stops.map(stop => ({
                  latitude: Number(stop.latitude),
                  longitude: Number(stop.longitude),
                }))}
                strokeWidth={4}
                strokeColor={theme.colors.icon}
              />
            </MapView>
          </View>
        )}

        {/* TRACK BUTTON */}
        {todayRoute && (
          <TouchableOpacity
            style={[
              styles.trackButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => navigation.navigate('LiveBusTracking')}
          >
            <Icon name='location-outline' size={20} color='white' />

            <Text style={styles.trackText}>Track Live Bus</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

export default MyDepartureRoute

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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  scrollContainer: {
    padding: 14,
  },

  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  infoText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  subTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  noBusText: {
    fontSize: 15,
    fontStyle: 'italic',
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  timeline: {
    alignItems: 'center',
    width: 20,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  line: {
    width: 2,
    height: 28,
    marginTop: 2,
  },

  stopText: {
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '600',
  },

  map: {
    height: 180,
    borderRadius: 10,
  },

  trackButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },

  trackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})