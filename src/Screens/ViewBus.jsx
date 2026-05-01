import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const ViewBus = ({ route, navigation }) => {
  const busId = route?.params?.busId;
  const { theme } = useContext(ThemeContext);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusDetails();
  }, []);

  const fetchBusDetails = async () => {
    try {
      const res = await fetch(
        `http://192.168.100.100:5000/bus-details/${busId}`,
      );
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>No Data</Text>
      </View>
    );
  }
  if (!busId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Bus ID not provided</Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Bus Information</Text>

        <View style={{ width: 26 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        {/* BUS CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>🚌 {data.bus_number}</Text>
          <Text>Capacity: {data.capacity}</Text>
          <Text>Status: {data.status}</Text>
          <Text>Driver: {data.driver_name}</Text>
        </View>

        {/* ROUTE CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>📍 {data.route.route_name}</Text>

          {/* SOURCE ⇄ DESTINATION */}
          <View style={styles.routeFlow}>
            <View style={styles.locationBox}>
              <Icon name="location" size={16} color="#2ecc71" />
              <Text style={styles.locationText}>{data.route.source}</Text>
            </View>

            <Icon
              name="swap-horizontal-outline"
              size={22}
              color={theme.colors.primary}
              style={{ marginHorizontal: 10 }}
            />

            <View style={styles.locationBox}>
              <Icon name="flag-outline" size={16} color="#e74c3c" />
              <Text style={styles.locationText}>{data.route.destination}</Text>
            </View>
          </View>

          {/* TIME */}
          <View style={styles.timeChip}>
            <Text style={styles.timeText}>🕒 {data.route.estimated_time}</Text>
          </View>
        </View>

        {/* STOPS */}
        <View style={styles.card}>
          <Text style={styles.title}>📌 Stops</Text>

          {data.route.stops.map((stop, index) => (
            <View key={index} style={styles.stopRow}>
              <Text style={styles.stopIndex}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1}>{stop.name}</Text>
                <Text style={styles.coords}>
                  {stop.latitude}, {stop.longitude}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewBus;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 12,
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  stopIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'green',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 10,
  },

  coords: {
    fontSize: 11,
    color: 'gray',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  routeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
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

  timeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f3f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  timeText: {
    fontSize: 12,
    color: '#555',
  },
});
