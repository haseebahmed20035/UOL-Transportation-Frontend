import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemeContext } from '../context/ThemeContext'

const BASE_URL = 'http://192.168.100.100:5000'

const DriverMyRoute = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [loading, setLoading] = useState(true)
  const [routeData, setRouteData] = useState(null)

  useEffect(() => {
    fetchMyRoute()
  }, [])

  const fetchMyRoute = async () => {
    try {
      setLoading(true)

      const storedUser = await AsyncStorage.getItem('user')

      if (!storedUser) {
        Alert.alert('Error', 'Driver data not found')
        setRouteData(null)
        return
      }

      const user = JSON.parse(storedUser)

      const driverId = user.driver_id || user.driverId || user.id || user.user_id

      if (!driverId) {
        Alert.alert('Error', 'Driver ID not found')
        setRouteData(null)
        return
      }

      const response = await fetch(`${BASE_URL}/driver/my-route/${driverId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setRouteData(result.data)
      } else {
        setRouteData(null)
      }
    } catch (error) {
      console.log('Fetch my route error:', error)
      Alert.alert('Error', 'Unable to load assigned route')
      setRouteData(null)
    } finally {
      setLoading(false)
    }
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
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle='light-content'
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='#fff' />
        </TouchableOpacity>

        <Text style={styles.headerText}>My Route</Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />

          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading your assigned route...
          </Text>
        </View>
      ) : !routeData ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Icon name='map-outline' size={48} color={theme.colors.primary} />
          </View>

          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No Route Assigned
          </Text>

          <Text style={styles.emptySubtitle}>
            Currently no bus or route is assigned to your driver account.
          </Text>

          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={fetchMyRoute}
          >
            <Icon name='reload-outline' size={18} color='#fff' />

            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* ROUTE SUMMARY CARD */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View
                style={[
                  styles.routeIconBox,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              >
                <Icon name='navigate' size={28} color='#fff' />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.routeName, { color: theme.colors.text }]}>
                  {routeData.route?.route_name || 'Assigned Route'}
                </Text>

                <Text style={styles.routePath}>
                  {routeData.route?.source || 'Source'} →{' '}
                  {routeData.route?.destination || 'Destination'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Icon name='bus-outline' size={22} color={theme.colors.primary} />

                <Text style={styles.infoLabel}>Bus Number</Text>

                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {routeData.bus?.bus_number || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Icon name='people-outline' size={22} color='#2196F3' />

                <Text style={styles.infoLabel}>Capacity</Text>

                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {routeData.bus?.capacity || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Icon name='time-outline' size={22} color='#FF9800' />

                <Text style={styles.infoLabel}>Estimated Time</Text>

                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {routeData.route?.estimated_time || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Icon name='checkmark-circle-outline' size={22} color='#4CAF50' />

                <Text style={styles.infoLabel}>Status</Text>

                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {routeData.bus?.status || 'Active'}
                </Text>
              </View>
            </View>
          </View>

          {/* JOURNEY CARD */}
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Journey
            </Text>

            <View style={styles.journeyRow}>
              <View style={styles.journeyIconColumn}>
                <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />

                <View style={styles.verticalLine} />

                <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.journeyItem}>
                  <Text style={styles.journeyLabel}>From</Text>

                  <Text style={[styles.journeyValue, { color: theme.colors.text }]}>
                    {routeData.route?.source || 'N/A'}
                  </Text>
                </View>

                <View style={styles.journeyItem}>
                  <Text style={styles.journeyLabel}>To</Text>

                  <Text style={[styles.journeyValue, { color: theme.colors.text }]}>
                    {routeData.route?.destination || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* STOPS CARD */}
          <View style={styles.card}>
            <View style={styles.stopsHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Route Stops
              </Text>

              <View style={styles.stopCountChip}>
                <Text style={styles.stopCountText}>
                  {routeData.route?.stops?.length || 0} Stops
                </Text>
              </View>
            </View>

            {routeData.route?.stops && routeData.route.stops.length > 0 ? (
              routeData.route.stops.map((stop, index) => (
                <View key={stop.id || index} style={styles.stopItem}>
                  <View style={styles.stopTimeline}>
                    <View
                      style={[
                        styles.stopNumber,
                        {
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Text style={styles.stopNumberText}>{index + 1}</Text>
                    </View>

                    {index !== routeData.route.stops.length - 1 && (
                      <View style={styles.stopLine} />
                    )}
                  </View>

                  <View style={styles.stopContent}>
                    <Text style={[styles.stopName, { color: theme.colors.text }]}>
                      {stop.stop_name || 'Unnamed Stop'}
                    </Text>

                    <View style={styles.coordinateRow}>
                      <Icon name='location-outline' size={14} color='#777' />

                      <Text style={styles.coordinateText}>
                        Lat: {stop.latitude || 'N/A'} | Lng:{' '}
                        {stop.longitude || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noStopsBox}>
                <Icon name='location-outline' size={34} color='#999' />

                <Text style={styles.noStopsText}>No stops available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

export default DriverMyRoute

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

  body: {
    padding: 20,
    marginTop: 20,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  routeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  routePath: {
    fontSize: 13,
    color: 'gray',
    marginTop: 5,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  infoBox: {
    width: '48%',
    backgroundColor: '#f5f7fb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },

  infoLabel: {
    color: 'gray',
    fontSize: 12,
    marginTop: 8,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  journeyRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  journeyIconColumn: {
    alignItems: 'center',
    marginRight: 14,
  },

  dot: {
    width: 15,
    height: 15,
    borderRadius: 8,
  },

  verticalLine: {
    width: 2,
    height: 48,
    backgroundColor: '#dce6dc',
    marginVertical: 5,
  },

  journeyItem: {
    marginBottom: 22,
  },

  journeyLabel: {
    color: 'gray',
    fontSize: 12,
  },

  journeyValue: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 4,
  },

  stopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  stopCountChip: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },

  stopCountText: {
    color: '#175812',
    fontSize: 12,
    fontWeight: 'bold',
  },

  stopItem: {
    flexDirection: 'row',
    minHeight: 76,
  },

  stopTimeline: {
    alignItems: 'center',
    marginRight: 14,
  },

  stopNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  stopNumberText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },

  stopLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#dce6dc',
    marginTop: 4,
  },

  stopContent: {
    flex: 1,
    paddingBottom: 18,
  },

  stopName: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  coordinateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  coordinateText: {
    color: '#777',
    fontSize: 12,
    marginLeft: 4,
  },

  noStopsBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  noStopsText: {
    color: '#777',
    marginTop: 8,
    fontWeight: '500',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  emptyIconBox: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: 'bold',
  },

  emptySubtitle: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },

  retryBtn: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },

  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
})