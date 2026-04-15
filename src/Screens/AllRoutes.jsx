import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { ThemeContext } from '../context/ThemeContext';

const routesData = [
  {
    id: 1,
    name: 'Township → UOL',
    busNo: 'UOL-07',
    time: '7:15 AM - 4:30 PM',
    stops: [
      { name: 'Township', lat: 31.4504, lng: 74.2906 },
      { name: 'Akbar Chowk', lat: 31.4803, lng: 74.3239 },
      { name: 'Kalma Chowk', lat: 31.5001, lng: 74.3297 },
      { name: 'UOL Campus', lat: 31.36, lng: 74.18 },
    ],
  },
  {
    id: 2,
    name: 'DHA → UOL',
    busNo: 'UOL-12',
    time: '7:00 AM - 5:00 PM',
    stops: [
      { name: 'DHA Phase 4', lat: 31.4697, lng: 74.41 },
      { name: 'Ghazi Road', lat: 31.44, lng: 74.38 },
      { name: 'UOL Campus', lat: 31.36, lng: 74.18 },
    ],
  },
];

const AllRoutes = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>All Routes</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {routesData.map(route => (
          <View
            key={route.id}
            style={[
              styles.card,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Text style={[styles.routeName, { color: theme.colors.text }]}>
              {route.name}
            </Text>

            <View style={styles.infoRow}>
              <Icon name="bus-outline" size={18} color={theme.colors.icon} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                Bus No: {route.busNo}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="time-outline" size={18} color={theme.colors.icon} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                {route.time}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="location-outline" size={18} color={theme.colors.icon} />
              <Text style={[styles.infoText, { color: theme.colors.text }]}>
                Stops: {route.stops.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.detailsBtn,
                { borderColor: theme.colors.border },
              ]}
              onPress={() => {
                setSelectedRoute(route);
                setShowDetails(true);
              }}
            >
              <Text style={[styles.detailsText, { color: theme.colors.text }]}>
                View Route Details
              </Text>
              <Icon name="chevron-forward" size={18} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* MODAL */}
      {showDetails && selectedRoute && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.card },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {selectedRoute.name}
            </Text>

            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Bus No: {selectedRoute.busNo}
            </Text>

            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Time: {selectedRoute.time}
            </Text>

            {/* MAP */}
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: selectedRoute.stops[0].lat,
                longitude: selectedRoute.stops[0].lng,
                latitudeDelta: 0.2,
                longitudeDelta: 0.2,
              }}
            >
              {selectedRoute.stops.map((stop, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: stop.lat,
                    longitude: stop.lng,
                  }}
                  title={stop.name}
                />
              ))}

              <Polyline
                coordinates={selectedRoute.stops.map(stop => ({
                  latitude: stop.lat,
                  longitude: stop.lng,
                }))}
                strokeWidth={4}
                strokeColor={theme.colors.icon}
              />
            </MapView>

            <Text style={[styles.subTitle, { color: theme.colors.text }]}>
              Route Stops
            </Text>

            {selectedRoute.stops.map((stop, index) => (
              <View key={index} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View style={[styles.dot, { backgroundColor: theme.colors.icon }]} />
                  {index !== selectedRoute.stops.length - 1 && (
                    <View style={[styles.line, { backgroundColor: theme.colors.icon }]} />
                  )}
                </View>
                <Text style={[styles.stopText, { color: theme.colors.text }]}>
                  {stop.name}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default AllRoutes;

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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    elevation: 2,
  },

  routeName: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  infoText: {
    fontSize: 14,
    fontWeight: '600',
  },

  detailsBtn: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  detailsText: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    maxHeight: '90%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  map: {
    height: 160,
    borderRadius: 10,
    marginVertical: 10,
  },

  subTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },

  closeBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  closeText: {
    color: 'white',
    fontWeight: 'bold',
  },

  stopRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  timeline: {
    width: 20,
    alignItems: 'center',
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
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
});
