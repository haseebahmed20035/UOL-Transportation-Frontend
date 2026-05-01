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

    return selectedRoute.stops.map(s => ({
      latitude: parseFloat(s.latitude),
      longitude: parseFloat(s.longitude),
    }));
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
          routes.map(route => (
            <TouchableOpacity
              key={route.id}
              style={styles.card}
              onPress={() => setSelectedRoute(route)}
            >
              {/* ROUTE NAME */}
              <Text style={styles.routeName}>🛣️ {route.route_name}</Text>

              {/* SOURCE → DESTINATION */}
              <View style={styles.routeFlow}>
                <View style={styles.locationBox}>
                  <Icon name="location-outline" size={16} color="#2ecc71" />
                  <Text style={styles.locationText}>{route.source}</Text>
                </View>

                <Icon name="swap-horizontal-outline" size={18} color="#999" />

                <View style={styles.locationBox}>
                  <Icon name="flag-outline" size={16} color="#e74c3c" />
                  <Text style={styles.locationText}>{route.destination}</Text>
                </View>
              </View>

              {/* META INFO */}
              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>🕒 {route.estimated_time}</Text>
                </View>

                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    📍 {route.stops.length} Stops
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* 🔥 MAP MODAL */}
      <Modal visible={!!selectedRoute} animationType="slide">
        <View style={{ flex: 1 }}>
          {/* HEADER */}
          <View
            style={[styles.header, { backgroundColor: theme.colors.primary }]}
          >
            <TouchableOpacity onPress={() => setSelectedRoute(null)}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                {selectedRoute?.route_name}
              </Text>
              <View style={{ flexDirection: 'row', gap:5, marginTop:5 }}>
                <Text style={{ color: '#eee', fontSize: 12 }}>
                  {selectedRoute?.source}
                </Text>
                <Icon name="swap-horizontal-outline" size={18} color="#999" />
                <Text style={{ color: '#eee', fontSize: 12 }}>
                  {selectedRoute?.destination}
                </Text>
              </View>
            </View>

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
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  routeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '40%',
  },

  locationText: {
    fontSize: 13,
    color: '#333',
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chip: {
    backgroundColor: '#f1f3f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  chipText: {
    fontSize: 12,
    color: '#555',
  },
});
