import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import React, { useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { routesByDay, getTodayId } from '../data/RouteModel';
import { ThemeContext } from '../context/ThemeContext';

const allRoutes = [
  {
    id: 1,
    title: 'Johar Town Route',
    arrival: '8:00 AM',
    departures: ['01:30 PM', '05:00 PM'],
    busNo: 'UOL-07',
    stops: ['Johar Town', 'Township', 'Thokar Niaz Baig', 'UOL Campus'],
  },
  {
    id: 2,
    title: 'Valencia Route',
    arrival: '8:10 AM',
    departures: ['02:00 PM', '05:30 PM'],
    busNo: 'UOL-08',
    stops: ['Valencia', 'Wapda Town', 'Thokar Niaz Baig', 'UOL Campus'],
  },
  {
    id: 3,
    title: 'Canal Route',
    arrival: '8:20 AM',
    departures: ['01:45 PM'],
    busNo: 'UOL-09',
    stops: ['Thokar Niaz Beg', 'Canal Road', 'Expo Center', 'UOL Campus'],
  },
];

const ChangeRoute = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const todayRoute = routesByDay[getTodayId()];
  const [requestedRoute, setRequestedRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const requestRouteChange = route => {
    setRequestedRoute(route);
    Alert.alert(
      'Request Sent',
      'Your route change request has been sent to admin.',
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            { color: theme.colors.icon },
          ]}
        >
          Change Route
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.mainBody}>
        {/* CURRENT ROUTE */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text },
          ]}
        >
          Your Current Route
        </Text>

        <View
          style={[
            styles.currentCard,
            { backgroundColor: theme.colors.box },
          ]}
        >
          <View style={styles.rowBetween}>
            <Text
              style={[
                styles.routeTitle,
                { color: theme.colors.text },
              ]}
            >
              {todayRoute?.arrival?.title}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setShowDetails(true);
                setSelectedRoute(todayRoute);
              }}
            >
              <Icon
                name="information-circle"
                size={35}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Icon name="time-outline" size={18} color={theme.colors.icon} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Arrival: {todayRoute?.arrival?.time}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="log-out-outline" size={18} color={theme.colors.icon} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Departure: {todayRoute?.departure?.timings.join(', ')}
            </Text>
          </View>
        </View>

        {/* AVAILABLE ROUTES */}
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text },
          ]}
        >
          Available Routes
        </Text>

        {allRoutes.map(
          route =>
            route.id !== todayRoute?.id && (
              <View
                key={route.id}
                style={[
                  styles.routeCard,
                  { backgroundColor: theme.colors.option },
                ]}
              >
                <Text
                  style={[
                    styles.routeTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  {route.title}
                </Text>

                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Arrival: {route.arrival}
                </Text>

                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Departure: {route.departures.join(', ')}
                </Text>

                <View style={styles.buttonRow}>
                  {/* DETAILS */}
                  <TouchableOpacity
                    style={[
                      styles.detailBtn,
                      { backgroundColor: theme.colors.card },
                    ]}
                    onPress={() => {
                      setSelectedRoute(route);
                      setShowDetails(true);
                    }}
                  >
                    <Text style={styles.btnText}>Details</Text>
                  </TouchableOpacity>

                  {/* REQUEST */}
                  <TouchableOpacity
                    style={[
                      styles.requestBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => requestRouteChange(route)}
                  >
                    <Text style={styles.btnText}>Request</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ),
        )}

        {/* DEMO APPROVAL */}
        {requestedRoute && (
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => {
              setRequestedRoute(null);
              Alert.alert('Approved', 'Admin approved your request!');
            }}
          >
            <Text style={styles.btnText}>
              (Demo) Admin Approve Request
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL */}
      {showDetails && selectedRoute && (
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: theme.colors.text },
              ]}
            >
              {selectedRoute?.arrival?.title || selectedRoute?.title}
            </Text>

            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Bus No: {selectedRoute?.arrival?.busNo || selectedRoute?.busNo}
            </Text>

            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Arrival: {selectedRoute?.arrival?.time || selectedRoute?.arrival}
            </Text>

            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Departure:{' '}
              {selectedRoute?.departure?.timings
                ? selectedRoute.departure.timings.join(', ')
                : selectedRoute?.departures?.join(', ')}
            </Text>

            <Text
              style={[
                styles.subTitle,
                { color: theme.colors.text },
              ]}
            >
              Route Stops
            </Text>

            {selectedRoute.stops.map((stop, index) => (
              <View key={index} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                  {index !== selectedRoute.stops.length - 1 && (
                    <View
                      style={[
                        styles.line,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.stopText,
                    { color: theme.colors.text },
                  ]}
                >
                  {typeof stop === 'string' ? stop : stop.name}
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
              <Text style={styles.btnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ChangeRoute;

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: { fontSize: 18, fontWeight: 'bold' },

  mainBody: { padding: 15 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  currentCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },

  routeCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },

  infoText: { fontSize: 14 },

  detailBtn: {
    padding: 10,
    borderRadius: 8,
  },

  requestBtn: {
    padding: 10,
    borderRadius: 8,
  },

  approveBtn: {
    marginTop: 20,
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  btnText: {
    color: 'white',
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
    borderRadius: 14,
    padding: 18,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  subTitle: {
    marginTop: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  closeBtn: {
    marginTop: 15,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
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

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
});