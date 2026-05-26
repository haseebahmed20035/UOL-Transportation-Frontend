import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'

const LOCATION_REFRESH_INTERVAL = 5000

const DEFAULT_REGION = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
}

const AllLiveTracking = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()

  const mapRef = useRef(null)
  const intervalRef = useRef(null)
  const mountedRef = useRef(true)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [runningBuses, setRunningBuses] = useState([])
  const [selectedBus, setSelectedBus] = useState(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  useEffect(() => {
    mountedRef.current = true

    fetchRunningBuses(true)

    intervalRef.current = setInterval(() => {
      fetchRunningBuses(false)
    }, LOCATION_REFRESH_INTERVAL)

    return () => {
      mountedRef.current = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const toNumberOrNull = value => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : null
  }

  const normalizeBusData = buses => {
    if (!Array.isArray(buses)) return []

    return buses
      .map(item => {
        const latitude = toNumberOrNull(item.latitude)
        const longitude = toNumberOrNull(item.longitude)

        if (latitude === null || longitude === null) {
          return null
        }

        return {
          ...item,
          latitude,
          longitude,
          bus_id: item.bus_id || item.id,
          bus_number: item.bus_number || 'Unknown Bus',
          driver_name: item.driver_name || 'Driver not available',
          route_name: item.route_name || 'Route not available',
          source: item.source || 'Source not available',
          destination: item.destination || 'Destination not available',
          status: item.status || 'running',
        }
      })
      .filter(Boolean)
  }

  const fetchRunningBuses = async showLoader => {
    try {
      if (showLoader) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await fetch(`${BASE_URL}/admin/running-buses`)
      const json = await response.json()

      if (!json?.success) {
        setRunningBuses([])
        setSelectedBus(null)
        return
      }

      const buses = normalizeBusData(json.buses)

      setRunningBuses(buses)
      setLastUpdatedAt(new Date())

      if (buses.length > 0) {
        const stillSelected = selectedBus
          ? buses.find(bus => Number(bus.bus_id) === Number(selectedBus.bus_id))
          : null

        const activeSelection = stillSelected || buses[0]
        setSelectedBus(activeSelection)

        setTimeout(() => {
          fitMapToBuses(buses)
        }, 350)
      } else {
        setSelectedBus(null)
      }
    } catch (error) {
      console.log('Admin running buses error:', error)

      if (showLoader) {
        Alert.alert(
          'Error',
          'Unable to load live buses. Please check your backend or internet connection.',
        )
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }

  const fitMapToBuses = buses => {
    if (!mapRef.current || !Array.isArray(buses) || buses.length === 0) return

    const coordinates = buses.map(bus => ({
      latitude: bus.latitude,
      longitude: bus.longitude,
    }))

    try {
      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 90,
            right: 60,
            bottom: 360,
            left: 60,
          },
          animated: true,
        })
      } else {
        mapRef.current.animateToRegion(
          {
            latitude: coordinates[0].latitude,
            longitude: coordinates[0].longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          },
          800,
        )
      }
    } catch (error) {
      console.log('Admin map fit error:', error)
    }
  }

  const focusBusOnMap = bus => {
    setSelectedBus(bus)

    try {
      mapRef.current?.animateToRegion(
        {
          latitude: bus.latitude,
          longitude: bus.longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        700,
      )
    } catch (error) {
      console.log('Focus bus error:', error)
    }
  }

  const formatLastUpdated = value => {
    if (!value) return 'Not updated yet'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  }

  const formatScreenLastUpdated = () => {
    if (!lastUpdatedAt) return 'Not updated yet'

    const hours = String(lastUpdatedAt.getHours()).padStart(2, '0')
    const minutes = String(lastUpdatedAt.getMinutes()).padStart(2, '0')
    const seconds = String(lastUpdatedAt.getSeconds()).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  }

  const renderBusCard = ({ item }) => {
    const isSelected =
      selectedBus && Number(selectedBus.bus_id) === Number(item.bus_id)

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => focusBusOnMap(item)}
        style={[
          styles.busCard,
          {
            backgroundColor: isSelected
              ? theme.colors.option
              : theme.colors.dashboard,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
          },
        ]}
      >
        <View style={styles.busCardTop}>
          <View
            style={[
              styles.busIconBox,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Icon name='bus' size={22} color={theme.colors.background} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[styles.busNumber, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.bus_number}
            </Text>

            <Text
              style={[styles.driverName, { color: theme.colors.icon }]}
              numberOfLines={1}
            >
              Driver: {item.driver_name}
            </Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.routeBox}>
          <View style={styles.routePointRow}>
            <View style={styles.startDot} />
            <Text
              style={[styles.routeText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.source}
            </Text>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routePointRow}>
            <View style={styles.endDot} />
            <Text
              style={[styles.routeText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.destination}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Icon name='map-outline' size={15} color={theme.colors.primary} />
            <Text
              style={[styles.footerText, { color: theme.colors.icon }]}
              numberOfLines={1}
            >
              {item.route_name}
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name='time-outline' size={15} color={theme.colors.primary} />
            <Text style={[styles.footerText, { color: theme.colors.icon }]}>
              {formatLastUpdated(item.updated_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name='arrow-back' size={26} color={theme.colors.icon} />
          </TouchableOpacity>

          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            All Buses Tracking
          </Text>

          <View style={{ width: 26 }} />
        </View>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loaderText, { color: theme.colors.text }]}>
            Loading active buses...
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.headerText} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.headerText }]}>
          All Buses Tracking
        </Text>

        <TouchableOpacity onPress={() => fetchRunningBuses(false)}>
          {refreshing ? (
            <ActivityIndicator size='small' color={theme.colors.icon} />
          ) : (
            <Icon name='refresh' size={24} color={theme.colors.headerText} />
          )}
        </TouchableOpacity>
      </View>

      {runningBuses.length === 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.emptyContainer,
            { paddingBottom: insets.bottom + 30 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRunningBuses(false)}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View
            style={[
              styles.emptyIconBox,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Icon name='bus-outline' size={44} color={theme.colors.primary} />
          </View>

          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No active buses right now
          </Text>

          <Text style={[styles.emptyMessage, { color: theme.colors.text }]}>
            When a driver starts a ride, the bus will appear here with its live
            location and route details.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => fetchRunningBuses(true)}
          >
            <Icon name='refresh' size={18} color={theme.colors.headerText} />
            <Text
              style={[styles.retryButtonText, { color: theme.colors.headerText }]}
            >
              Refresh
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              mapType='standard'
              initialRegion={
                selectedBus
                  ? {
                      latitude: selectedBus.latitude,
                      longitude: selectedBus.longitude,
                      latitudeDelta: 0.035,
                      longitudeDelta: 0.035,
                    }
                  : DEFAULT_REGION
              }
              showsCompass
              showsTraffic
              showsBuildings
              showsIndoors
              showsPointsOfInterest
              toolbarEnabled={false}
              loadingEnabled
            >
              {runningBuses.map(bus => {
                const isSelected =
                  selectedBus &&
                  Number(selectedBus.bus_id) === Number(bus.bus_id)

                return (
                  <Marker
                    key={`bus-${bus.bus_id}`}
                    coordinate={{
                      latitude: bus.latitude,
                      longitude: bus.longitude,
                    }}
                    title={bus.bus_number}
                    description={`${bus.driver_name} • ${bus.route_name}`}
                    onPress={() => setSelectedBus(bus)}
                  >
                    <View
                      style={[
                        styles.mapBusMarker,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : '#2563EB',
                        },
                      ]}
                    >
                      <Icon name='bus' size={22} color='#fff' />
                    </View>
                  </Marker>
                )
              })}
            </MapView>

            <View
              style={[
                styles.mapStatsCard,
                {
                  backgroundColor: theme.colors.dashboard,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <View>
                <Text
                  style={[styles.mapStatsLabel, { color: theme.colors.icon }]}
                >
                  Currently Active
                </Text>
                <Text
                  style={[styles.mapStatsValue, { color: theme.colors.text }]}
                >
                  {runningBuses.length} Bus{runningBuses.length > 1 ? 'es' : ''}
                </Text>
              </View>

              <View style={styles.autoRefreshPill}>
                <Icon name='sync-outline' size={14} color='#0A8F3C' />
                <Text style={styles.autoRefreshText}>
                  {formatScreenLastUpdated()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.fitButton,
                { backgroundColor: theme.colors.dashboard },
              ]}
              onPress={() => fitMapToBuses(runningBuses)}
            >
              <Icon
                name='scan-outline'
                size={22}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.bottomSheet,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
                paddingBottom: insets.bottom + 10,
              },
            ]}
          >
            <View style={styles.dragHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
                  Live Running Buses
                </Text>
                <Text
                  style={[styles.sheetSubtitle, { color: theme.colors.icon }]}
                >
                  Auto refresh every 5 seconds
                </Text>
              </View>

              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: theme.colors.option },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: theme.colors.primary },
                  ]}
                >
                  {runningBuses.length}
                </Text>
              </View>
            </View>

            {selectedBus && (
              <View
                style={[
                  styles.selectedInfoCard,
                  {
                    backgroundColor: theme.colors.option,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.selectedInfoTop}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectedBusTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedBus.bus_number}
                    </Text>

                    <Text
                      style={[
                        styles.selectedBusSubtitle,
                        { color: theme.colors.icon },
                      ]}
                    >
                      {selectedBus.driver_name}
                    </Text>
                  </View>

                  <View style={styles.selectedLiveBadge}>
                    <Icon name='radio-outline' size={14} color='#0A8F3C' />
                    <Text style={styles.selectedLiveText}>Live</Text>
                  </View>
                </View>

                <View style={styles.selectedGrid}>
                  <View
                    style={[
                      styles.selectedGridBox,
                      { backgroundColor: theme.colors.dashboard },
                    ]}
                  >
                    <Icon
                      name='navigate-outline'
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.selectedGridLabel,
                        { color: theme.colors.icon },
                      ]}
                    >
                      Latitude
                    </Text>
                    <Text
                      style={[
                        styles.selectedGridValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedBus.latitude.toFixed(5)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.selectedGridBox,
                      { backgroundColor: theme.colors.dashboard },
                    ]}
                  >
                    <Icon
                      name='location-outline'
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text
                      style={[
                        styles.selectedGridLabel,
                        { color: theme.colors.icon },
                      ]}
                    >
                      Longitude
                    </Text>
                    <Text
                      style={[
                        styles.selectedGridValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedBus.longitude.toFixed(5)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <FlatList
              data={runningBuses}
              keyExtractor={item => String(item.bus_id)}
              renderItem={renderBusCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.busListContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchRunningBuses(false)}
                  colors={[theme.colors.primary]}
                />
              }
            />
          </View>
        </>
      )}
    </View>
  )
}

export default AllLiveTracking

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

  mapStatsCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  mapStatsLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  mapStatsValue: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '900',
  },

  autoRefreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  autoRefreshText: {
    marginLeft: 5,
    color: '#0A8F3C',
    fontSize: 12,
    fontWeight: '800',
  },

  fitButton: {
    position: 'absolute',
    right: 18,
    top: 92,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  mapBusMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },

  bottomSheet: {
    maxHeight: '58%',
    minHeight: 365,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    elevation: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
  },

  dragHandle: {
    width: 46,
    height: 5,
    borderRadius: 50,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },

  sheetSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },

  countBadge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadgeText: {
    fontSize: 18,
    fontWeight: '900',
  },

  selectedInfoCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
  },

  selectedInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  selectedBusTitle: {
    fontSize: 17,
    fontWeight: '900',
  },

  selectedBusSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
  },

  selectedLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  selectedLiveText: {
    marginLeft: 4,
    color: '#0A8F3C',
    fontSize: 12,
    fontWeight: '900',
  },

  selectedGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  selectedGridBox: {
    flex: 1,
    borderRadius: 15,
    padding: 11,
  },

  selectedGridLabel: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: '700',
  },

  selectedGridValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '900',
  },

  busListContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  busCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  busCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  busIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  busNumber: {
    fontSize: 16,
    fontWeight: '900',
  },

  driverName: {
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: '600',
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8EF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0A8F3C',
    marginRight: 5,
  },

  liveBadgeText: {
    color: '#0A8F3C',
    fontSize: 11,
    fontWeight: '900',
  },

  routeBox: {
    marginTop: 13,
  },

  routePointRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  startDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    marginRight: 10,
  },

  endDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 10,
  },

  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: '#CBD5E1',
    marginLeft: 4.5,
    marginVertical: 2,
  },

  routeText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },

  cardFooter: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  footerText: {
    marginLeft: 5,
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  emptyIconBox: {
    width: 86,
    height: 86,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 15,
  },

  retryButtonText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: '800',
  },
})
