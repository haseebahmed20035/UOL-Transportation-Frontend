import React, { useEffect, useState, useContext } from 'react'

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'

import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'

const UpdateBus = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])

  const [selectedBus, setSelectedBus] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)

  const [originalRoute, setOriginalRoute] = useState(null)
  const [originalDriver, setOriginalDriver] = useState(null)

  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)

      const busRes = await fetch(`${BASE_URL}/buses`)
      const routeRes = await fetch(`${BASE_URL}/routes`)
      const driverRes = await fetch(`${BASE_URL}/available-drivers`)

      const busData = await busRes.json()
      const routeData = await routeRes.json()
      const driverData = await driverRes.json()

      setBuses(Array.isArray(busData) ? busData : [])
      setRoutes(Array.isArray(routeData) ? routeData : [])
      setDrivers(Array.isArray(driverData) ? driverData : [])
    } catch (err) {
      console.log(err)
      Alert.alert('Error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSelectBus = bus => {
    const matchedRoute = routes.find(route => {
      const sameId = bus?.route_id && Number(bus.route_id) === Number(route.id)

      const sameRouteName =
        bus?.route_name &&
        route?.route_name &&
        String(bus.route_name).trim().toLowerCase() ===
          String(route.route_name).trim().toLowerCase()

      const sameSourceDestination =
        bus?.source &&
        bus?.destination &&
        route?.source &&
        route?.destination &&
        String(bus.source).trim().toLowerCase() ===
          String(route.source).trim().toLowerCase() &&
        String(bus.destination).trim().toLowerCase() ===
          String(route.destination).trim().toLowerCase()

      return sameId || sameRouteName || sameSourceDestination
    })

    const currentRouteId = matchedRoute
      ? Number(matchedRoute.id)
      : Number(bus.route_id)

    const currentDriverId = Number(bus.driver_id)

    setSelectedBus(bus)

    setSelectedRoute(currentRouteId)
    setSelectedDriver(currentDriverId)

    setOriginalRoute(currentRouteId)
    setOriginalDriver(currentDriverId)
  }

  const mergedDrivers = React.useMemo(() => {
    const currentDriver =
      selectedBus?.driver_id && selectedBus?.driver_name
        ? {
            id: Number(selectedBus.driver_id),
            name: selectedBus.driver_name,
            isCurrentAssigned: true,
          }
        : null

    const availableDrivers = drivers.map(driver => ({
      ...driver,
      id: Number(driver.id),
      isCurrentAssigned: false,
    }))

    const allDrivers = currentDriver
      ? [currentDriver, ...availableDrivers]
      : availableDrivers

    return allDrivers.filter(
      (driver, index, self) =>
        index === self.findIndex(d => Number(d.id) === Number(driver.id)),
    )
  }, [drivers, selectedBus])

  const mergedRoutes = React.useMemo(() => {
    const currentRoute = selectedBus?.route_id
      ? {
          id: Number(selectedBus.route_id),
          route_name:
            selectedBus.route_name ||
            `${selectedBus.source || 'Source'} → ${
              selectedBus.destination || 'Destination'
            }`,
          source: selectedBus.source,
          destination: selectedBus.destination,
          isCurrentAssigned: true,
        }
      : null

    const allRoutes = routes.map(route => ({
      ...route,
      id: Number(route.id),
      isCurrentAssigned: false,
    }))

    const merged = currentRoute ? [currentRoute, ...allRoutes] : allRoutes

    return merged.filter(
      (route, index, self) =>
        index === self.findIndex(r => Number(r.id) === Number(route.id)),
    )
  }, [routes, selectedBus])

  const handleUpdate = async () => {
    if (!selectedBus) {
      Alert.alert('Error', 'Select a bus')
      return
    }

    const payload = {}

    if (Number(selectedRoute) !== Number(originalRoute)) {
      payload.route_id = Number(selectedRoute)
    }

    if (Number(selectedDriver) !== Number(originalDriver)) {
      payload.driver_id = Number(selectedDriver)
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('Info', 'No changes made')
      return
    }

    try {
      setUpdating(true)

      const res = await fetch(`${BASE_URL}/update-bus/${selectedBus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        Alert.alert('Success', data.message || 'Bus updated successfully')

        setSelectedBus(null)
        setSelectedRoute(null)
        setSelectedDriver(null)
        setOriginalRoute(null)
        setOriginalDriver(null)

        fetchData()
      } else {
        Alert.alert('Error', data.message || 'Update failed')
      }
    } catch (err) {
      console.log(err)
      Alert.alert('Error', 'Server error')
    } finally {
      setUpdating(false)
    }
  }

  const getSelectedRouteName = () => {
    const route = routes.find(r => Number(r.id) === Number(originalRoute))
    if (!route) return selectedBus?.route_name || 'Not Assigned'

    return route.route_name || `${route.source} → ${route.destination}`
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='#fff' />
        </TouchableOpacity>

        <Text style={styles.headerText}>Update Bus</Text>

        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading buses...
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Select Bus
          </Text>

          {buses.map(bus => {
            const isSelected = Number(selectedBus?.id) === Number(bus.id)

            return (
              <TouchableOpacity
                key={bus.id}
                activeOpacity={0.85}
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
                  isSelected && styles.activeBorder,
                ]}
                onPress={() => handleSelectBus(bus)}
              >
                <View style={styles.busTopRow}>
                  <View style={styles.busIconBox}>
                    <Icon
                      name='bus'
                      size={24}
                      color={isSelected ? '#4CAF50' : theme.colors.icon}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.busNumber, { color: theme.colors.text }]}
                    >
                      {bus.bus_number}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={[styles.busSubText, { color: theme.colors.text }]}
                    >
                      Driver: {bus.driver_name || 'Not Assigned'}
                    </Text>
                  </View>

                  {isSelected && (
                    <Icon name='checkmark-circle' size={24} color='#4CAF50' />
                  )}
                </View>

                <View style={styles.routeLine}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.routeSmallText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {bus.source || 'Source'}
                  </Text>

                  <Icon
                    name='swap-horizontal-outline'
                    size={18}
                    color={theme.colors.icon}
                    style={{ marginHorizontal: 8 }}
                  />

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.routeSmallText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {bus.destination || 'Destination'}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}

          {selectedBus && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Current Active Assignment
              </Text>

              <View
                style={[
                  styles.currentCard,
                  { backgroundColor: theme.colors.dashboard },
                ]}
              >
                <View style={styles.currentRow}>
                  <Icon
                    name='bus-outline'
                    size={22}
                    color={theme.colors.icon}
                  />

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.currentTitle,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedBus.bus_number}
                    </Text>

                    <Text
                      style={[styles.currentSub, { color: theme.colors.text }]}
                    >
                      This is the assigned driver and route before update
                    </Text>
                  </View>

                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Current</Text>
                  </View>
                </View>

                <View style={styles.currentInfoGrid}>
                  <View
                    style={[
                      styles.currentInfoBox,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Icon name='person' size={20} color='#FF9800' />
                    <Text
                      style={[
                        styles.currentInfoLabel,
                        { color: theme.colors.text },
                      ]}
                    >
                      Active Driver
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.currentInfoValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {selectedBus.driver_name || 'Not Assigned'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.currentInfoBox,
                      { backgroundColor: theme.colors.background },
                    ]}
                  >
                    <Icon name='map' size={20} color='#2196F3' />
                    <Text
                      style={[
                        styles.currentInfoLabel,
                        { color: theme.colors.text },
                      ]}
                    >
                      Active Route
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.currentInfoValue,
                        { color: theme.colors.text },
                      ]}
                    >
                      {getSelectedRouteName()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Select Route
              </Text>

              {mergedRoutes.map(route => {
                const isCurrentActive =
                  Number(originalRoute) === Number(route.id)
                const isSelected = Number(selectedRoute) === Number(route.id)
                const isChangedSelection = isSelected && !isCurrentActive

                return (
                  <TouchableOpacity
                    key={route.id}
                    activeOpacity={0.85}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.option
                          : theme.colors.dashboard,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                      isSelected && styles.activeBorder,
                    ]}
                    onPress={() => setSelectedRoute(Number(route.id))}
                  >
                    <View style={styles.optionRow}>
                      <View style={styles.optionIconBox}>
                        <Icon
                          name={isSelected ? 'checkmark-circle' : 'map-outline'}
                          size={22}
                          color={isSelected ? '#4CAF50' : theme.colors.icon}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.optionTitle,
                            { color: theme.colors.text },
                          ]}
                        >
                          {route.route_name || 'Route'}
                        </Text>

                        <View style={styles.routeFlow}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.routeText,
                              { color: theme.colors.text },
                            ]}
                          >
                            {route.source}
                          </Text>

                          <Icon
                            name='swap-horizontal-outline'
                            size={17}
                            color={theme.colors.icon}
                            style={{ marginHorizontal: 6 }}
                          />

                          <Text
                            numberOfLines={1}
                            style={[
                              styles.routeText,
                              { color: theme.colors.text },
                            ]}
                          >
                            {route.destination}
                          </Text>
                        </View>
                      </View>

                      {isCurrentActive && (
                        <View style={styles.currentPill}>
                          <Text style={styles.currentPillText}>
                            Current Active
                          </Text>
                        </View>
                      )}

                      {isChangedSelection && (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedPillText}>Selected</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}

              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Select Driver
              </Text>

              {mergedDrivers.map(driver => {
                const isCurrentActive =
                  Number(originalDriver) === Number(driver.id)
                const isSelected = Number(selectedDriver) === Number(driver.id)
                const isChangedSelection = isSelected && !isCurrentActive

                return (
                  <TouchableOpacity
                    key={driver.id}
                    activeOpacity={0.85}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.option
                          : theme.colors.dashboard,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                      isSelected && styles.activeBorder,
                    ]}
                    onPress={() => setSelectedDriver(Number(driver.id))}
                  >
                    <View style={styles.optionRow}>
                      <View style={styles.optionIconBox}>
                        <Icon
                          name={
                            isSelected ? 'checkmark-circle' : 'person-outline'
                          }
                          size={22}
                          color={isSelected ? '#4CAF50' : theme.colors.icon}
                        />
                      </View>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.optionTitle,
                          { color: theme.colors.text, flex: 1 },
                        ]}
                      >
                        {driver.name}
                      </Text>

                      {isCurrentActive && (
                        <View style={styles.currentPill}>
                          <Text style={styles.currentPillText}>
                            Current Active
                          </Text>
                        </View>
                      )}

                      {isChangedSelection && (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedPillText}>Selected</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })}

              <TouchableOpacity
                disabled={updating}
                activeOpacity={0.85}
                style={[
                  styles.updateBtn,
                  {
                    backgroundColor: updating ? '#999' : theme.colors.primary,
                  },
                ]}
                onPress={handleUpdate}
              >
                {updating ? (
                  <ActivityIndicator size='small' color='#fff' />
                ) : (
                  <Icon name='save-outline' size={18} color='#fff' />
                )}

                <Text style={styles.updateText}>
                  {updating ? 'Updating...' : 'Update Bus'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

export default UpdateBus

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 15,
    paddingBottom: 35,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 12,
  },

  busCard: {
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1.3,
    elevation: 4,
  },

  activeBorder: {
    borderWidth: 2,
  },

  busTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  busIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(26,128,63,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  busNumber: {
    fontSize: 17,
    fontWeight: '900',
  },

  busSubText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
    opacity: 0.85,
  },

  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingLeft: 60,
  },

  routeSmallText: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '42%',
  },

  currentCard: {
    borderRadius: 24,
    padding: 16,
    elevation: 4,
    marginBottom: 8,
  },

  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  currentTitle: {
    fontSize: 16,
    fontWeight: '900',
  },

  currentSub: {
    fontSize: 11,
    marginTop: 3,
    opacity: 0.8,
  },

  currentInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  currentInfoBox: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
  },

  currentInfoLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    opacity: 0.85,
  },

  currentInfoValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 5,
    textAlign: 'center',
  },

  optionCard: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    borderWidth: 1.3,
    elevation: 3,
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(26,128,63,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '900',
  },

  routeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  routeText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '42%',
    opacity: 0.9,
  },

  activePill: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },

  activePillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
  },

  currentPill: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    marginLeft: 8,
  },

  currentPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  selectedPill: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 100,
    marginLeft: 8,
  },

  selectedPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },

  updateBtn: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 18,
    elevation: 4,
  },

  updateText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '900',
    fontSize: 15,
  },
})
