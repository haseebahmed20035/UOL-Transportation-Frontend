import React, { useEffect, useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const ViewRoutes = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);

  // 🔥 Fetch routes
  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://192.168.100.100:5000/routes-with-stops');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // 🔥 Polyline
  const getPolylineCoords = () => {
    if (!selectedRoute) return [];

    return selectedRoute.stops.map((s) => ({
      latitude: parseFloat(s.latitude),
      longitude: parseFloat(s.longitude),
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>View Routes</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* ROUTES LIST */}
      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {routes.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No routes found
          </Text>
        ) : (
          routes.map((route) => (
            <TouchableOpacity
              key={route.id}
              style={styles.card}
              onPress={() => setSelectedRoute(route)}
            >
              <Text style={styles.routeName}>
                {route.source} → {route.destination}
              </Text>

              <View style={styles.row}>
                <Text style={styles.meta}>🕒 {route.estimated_time}</Text>
                <Text style={styles.meta}>📍 {route.stops.length} stops</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 🔥 MAP MODAL */}
      <Modal visible={!!selectedRoute} animationType="slide">
        <View style={{ flex: 1 }}>

          {/* HEADER */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity onPress={() => setSelectedRoute(null)}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerText}>
              {selectedRoute?.source} → {selectedRoute?.destination}
            </Text>

            <View style={{ width: 26 }} />
          </View>

          {/* MAP */}
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: parseFloat(selectedRoute?.stops[0]?.latitude || 31.5),
              longitude: parseFloat(selectedRoute?.stops[0]?.longitude || 74.3),
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* MARKERS */}
            {selectedRoute?.stops.map((stop, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: parseFloat(stop.latitude),
                  longitude: parseFloat(stop.longitude),
                }}
                title={stop.stop_name}
              />
            ))}

            {/* ROUTE LINE */}
            <Polyline
              coordinates={getPolylineCoords()}
              strokeWidth={4}
              strokeColor={theme.colors.primary}
            />
          </MapView>

        </View>
      </Modal>

    </View>
  );
};

export default ViewRoutes;

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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },

  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  meta: {
    fontSize: 13,
    color: '#555',
  },
});