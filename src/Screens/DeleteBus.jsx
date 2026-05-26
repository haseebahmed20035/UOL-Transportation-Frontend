import React, { useEffect, useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { BASE_URL, endPoints } from '../services/baseUrl'

const DeleteBus = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch buses
  const fetchBuses = async () => {
    try {
      const res = await fetch(`${BASE_URL}/buses`);
      const data = await res.json();
      setBuses(data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to load buses');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  // 🔥 Delete bus
  const handleDelete = (busId, busNumber) => {
    Alert.alert(
      'Delete Bus',
      `Are you sure you want to delete ${busNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `http://192.168.100.100:5000/delete-bus/${busId}`,
                { method: 'DELETE' }
              );

              const data = await res.json();

              if (res.ok) {
                Alert.alert('Success', data.message);

                // 🔥 refresh list
                fetchBuses();
              } else {
                Alert.alert('Error', data.message);
              }
            } catch (err) {
              Alert.alert('Error', 'Server error');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Delete Bus</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : buses.length === 0 ? (
        <View style={styles.center}>
          <Text>No buses available</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          {buses.map((bus) => (
            <View key={bus.id} style={styles.card}>
              
              {/* BUS INFO */}
              <View style={{ flex: 1 }}>
                <Text style={styles.busTitle}>🚌 {bus.bus_number}</Text>

                <Text style={styles.meta}>
                  Driver: {bus.driver_name || 'N/A'}
                </Text>

                <Text style={styles.meta}>
                  Route: {bus.route_name || 'N/A'}
                </Text>

                <Text style={styles.meta}>
                  Capacity: {bus.capacity}
                </Text>
              </View>

              {/* DELETE BUTTON */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(bus.id, bus.bus_number)}
              >
                <Icon name="trash" size={20} color="#fff" />
              </TouchableOpacity>

            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default DeleteBus;

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

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
    alignItems: 'center',
  },

  busTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  meta: {
    fontSize: 13,
    color: '#555',
  },

  deleteBtn: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});