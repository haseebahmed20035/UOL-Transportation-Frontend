import React, { useEffect, useState, useContext } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView, 
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

const UpdateBus = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // 🔥 original values (for comparison)
  const [originalRoute, setOriginalRoute] = useState(null);
  const [originalDriver, setOriginalDriver] = useState(null);

  // 🔥 Fetch data
  const fetchData = async () => {
    try {
      const busRes = await fetch('http://192.168.100.100:5000/buses');
      const routeRes = await fetch('http://192.168.100.100:5000/routes');
      const driverRes = await fetch(
        'http://192.168.100.100:5000/available-drivers',
      );

      setBuses(await busRes.json());
      setRoutes(await routeRes.json());
      setDrivers(await driverRes.json());
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔥 Include current driver + available drivers
  const mergedDrivers = [
    ...(selectedBus?.driver_id
      ? [
          {
            id: selectedBus.driver_id,
            name: selectedBus.driver_name,
          },
        ]
      : []),
    ...drivers,
  ];

  // 🔥 Select Bus
  const handleSelectBus = bus => {
    setSelectedBus(bus);

    setSelectedRoute(bus.route_id);
    setSelectedDriver(bus.driver_id);

    // store original values
    setOriginalRoute(bus.route_id);
    setOriginalDriver(bus.driver_id);
  };

  // 🔥 Update Bus (ONLY changed fields)
  const handleUpdate = async () => {
    if (!selectedBus) {
      Alert.alert('Error', 'Select a bus');
      return;
    }

    let payload = {};

    if (selectedRoute !== originalRoute) {
      payload.route_id = selectedRoute;
    }

    if (selectedDriver !== originalDriver) {
      payload.driver_id = selectedDriver;
    }

    // nothing changed
    if (Object.keys(payload).length === 0) {
      Alert.alert('Info', 'No changes made');
      return;
    }

    try {
      const res = await fetch(
        `http://192.168.100.100:5000/update-bus/${selectedBus.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', data.message);

        // reset
        setSelectedBus(null);
        setSelectedRoute(null);
        setSelectedDriver(null);

        fetchData();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server error');
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Update Bus</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ padding: 15 }}>
        {/* BUS LIST */}
        <Text style={styles.sectionTitle}>Select Bus</Text>

        {buses.map(bus => (
          <TouchableOpacity
            key={bus.id}
            style={[
              styles.card,
              selectedBus?.id === bus.id && styles.selectedCard,
            ]}
            onPress={() => handleSelectBus(bus)}
          >
            <Text style={styles.busNumber}>{bus.bus_number}</Text>
            <Text>Driver: {bus.driver_name}</Text>
            <Text>
              {bus.source} → {bus.destination}
            </Text>
          </TouchableOpacity>
        ))}

        {/* FORM */}
        {selectedBus && (
          <>
            <Text style={styles.sectionTitle}>Update Details</Text>

            {/* ROUTES */}
            <Text style={styles.label}>Select Route</Text>
            {routes.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.option,
                  selectedRoute === r.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedRoute(r.id)}
              >
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  <Text>{r.source}</Text>
                  <Icon
                    name="swap-horizontal-outline"
                    size={22}
                    color={theme.colors.primary}
                    style={{ marginHorizontal: 10 }}
                  />
                  <Text>{r.destination}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* DRIVERS */}
            <Text style={styles.label}>Select Driver</Text>
            {mergedDrivers.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.option,
                  selectedDriver === d.id && styles.selectedOption,
                ]}
                onPress={() => setSelectedDriver(d.id)}
              >
                <Text>{d.name}</Text>
              </TouchableOpacity>
            ))}

            {/* UPDATE BUTTON */}
            <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
              <Icon name="save-outline" size={18} color="#fff" />
              <Text style={styles.updateText}>Update Bus</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default UpdateBus;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },

  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: '#007bff',
  },

  busNumber: {
    fontWeight: 'bold',
  },

  label: {
    marginTop: 10,
    fontWeight: '600',
  },

  option: {
    padding: 10,
    backgroundColor: '#fff',
    marginTop: 6,
    borderRadius: 8,
  },

  selectedOption: {
    borderWidth: 2,
    borderColor: '#007bff',
  },

  updateBtn: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
  },

  updateText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: 'bold',
  },
});
