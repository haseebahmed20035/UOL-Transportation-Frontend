import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'
import { Dimensions } from 'react-native'
import { BASE_URL, endPoints } from '../services/baseUrl'

const AddBus = ({ navigation }) => {
  const { width, height } = Dimensions.get('window')

  // 📱 Responsive helpers
  const wp = percentage => (width * percentage) / 100
  const hp = percentage => (height * percentage) / 100
  const { theme } = useContext(ThemeContext)

  const [capacity, setCapacity] = useState('30')
  const [routes, setRoutes] = useState([])
  const [drivers, setDrivers] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [loading, setLoading] = useState(false)
  const [departureTime, setDepartureTime] = useState('')
  const [departureTimings, setDepartureTimings] = useState([])

  // ✅ Fetch routes
  const fetchData = () => {
    // routes
    fetch(`${BASE_URL}/${endPoints.routes}`)
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.log('Route error:', err))

    // drivers
    fetch(`${BASE_URL}/${endPoints.availableDrivers}`)
      .then(res => res.json())
      .then(data => setDrivers(data))
      .catch(err => console.log('Driver error:', err))
  }
  const addDepartureTiming = () => {
    if (!departureTime.trim()) {
      Alert.alert('Enter departure timing')
      return
    }

    setDepartureTimings(prev => [...prev, departureTime])

    setDepartureTime('')
  }
  useEffect(() => {
    fetchData()
  }, [])

  const handleAddBus = async () => {
    // ✅ validation first
    if (!capacity || !selectedRoute || !selectedDriver) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${BASE_URL}/${endPoints.addBus}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacity: capacity,
          route_id: selectedRoute,
          driver_id: selectedDriver,
          departure_timings: departureTimings,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert('Success', data.message)

        // reset fields
        setCapacity('')
        setSelectedRoute(null)
        setSelectedDriver(null)

        // 🔥 refresh drivers + routes
        fetchData()
      } else {
        Alert.alert('Error', data.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Server not reachable')
    }

    setLoading(false)
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='#fff' />
        </TouchableOpacity>

        <Text style={styles.headerText}>Add Bus</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={[styles.form]}
        contentContainerStyle={{ paddingBottom: hp(5) }}
        showsVerticalScrollIndicator={false}
      >
        {/* DRIVER SELECTION */}
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Select Driver
        </Text>

        {drivers.length === 0 ? (
          <Text style={{ color: 'gray', marginBottom: 20 }}>
            No drivers available
          </Text>
        ) : (
          drivers.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.routeBox,
                {
                  borderColor:
                    selectedDriver === item.id ? theme.colors.primary : '#ccc',
                },
              ]}
              onPress={() => setSelectedDriver(item.id)}
            >
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>

              <Text style={{ color: 'gray' }}>
                {item.is_available
                  ? 'Available'
                  : `Assigned to ${item.bus_number}`}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* ROUTE SELECTION */}
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Select Route
        </Text>

        {routes.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.routeBox,
              {
                borderColor:
                  selectedRoute === item.id ? theme.colors.primary : '#ccc',
              },
            ]}
            onPress={() => setSelectedRoute(item.id)}
          >
            <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>
              {item.route_name}
            </Text>

            <Text style={{ color: theme.colors.text, marginTop: 4 }}>
              {item.source} → {item.destination}
            </Text>

            <Text style={{ color: theme.colors.text, marginTop: 4 }}>
              {item.destination} → {item.source}
            </Text>

            <Text style={{ fontSize: 12, color: 'gray' }}>
              Time: {item.estimated_time}
            </Text>
          </TouchableOpacity>
        ))}
        {/* DEPARTURE TIMINGS */}
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Departure Timings
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <TextInput
            placeholder='e.g. 2:00 PM'
            value={departureTime}
            onChangeText={setDepartureTime}
            style={[
              styles.input,
              {
                flex: 1,
                marginBottom: 0,
                color: theme.colors.text,
              },
            ]}
          />

          <TouchableOpacity
            onPress={addDepartureTiming}
            style={{
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              paddingHorizontal: 18,
              borderRadius: 10,
            }}
          >
            <Icon name='add' size={24} color='#fff' />
          </TouchableOpacity>
        </View>

        {departureTimings.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: '#fff',
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text>{item}</Text>

            <TouchableOpacity
              onPress={() => {
                setDepartureTimings(
                  departureTimings.filter((_, i) => i !== index),
                )
              }}
            >
              <Icon name='trash' size={18} color='red' />
            </TouchableOpacity>
          </View>
        ))}
        {/* Capacity */}
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Write Bus Capacty
        </Text>
        <TextInput
          placeholder='Bus Capacity'
          placeholderTextColor='#888'
          keyboardType='numeric'
          value={capacity}
          onChangeText={setCapacity}
          style={[styles.input, { color: theme.colors.text }]}
        />
        {/* BUTTON */}
        <TouchableOpacity
          disabled={loading}
          style={[
            styles.button,
            { backgroundColor: loading ? 'gray' : theme.colors.primary },
          ]}
          onPress={handleAddBus}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Adding...' : 'Add Bus'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

export default AddBus

const styles = StyleSheet.create({
  container: { flex: 1 },

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

  form: {
    padding: 20,
    marginTop: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: '600',
  },

  routeBox: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },

  button: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})