import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import React, { useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { routesByDay, getTodayId } from '../data/RouteModel';
import { ThemeContext } from '../context/ThemeContext';

const MyArrivalRoute = ({ navigation }) => {

  const { theme } = useContext(ThemeContext);

  const todayRoute = routesByDay[getTodayId()];

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme.colors.background }
    ]}>

      {/* HEADER */}
      <View style={[
        styles.header,
        { backgroundColor: theme.colors.primary }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>My Arrival Route</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* ROUTE SUMMARY */}
        <View style={[
          styles.card,
          { backgroundColor: theme.colors.option } // ✅ using option
        ]}>

          {!todayRoute ? (
            <Text style={[
              styles.noBusText,
              { color: theme.colors.text }
            ]}>
              No bus service available today
            </Text>
          ) : (
            <>
              <Text style={[
                styles.routeName,
                { color: theme.colors.text }
              ]}>
                Today’s Route ({todayRoute.day})
              </Text>

              <View style={styles.infoRow}>
                <Icon name="navigate-outline" size={18} color={theme.colors.icon} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  {todayRoute.arrival.title}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="bus-outline" size={18} color={theme.colors.icon} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Bus No: {todayRoute.arrival.busNo}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Icon name="time-outline" size={18} color={theme.colors.icon} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Arrival at University: {todayRoute.arrival.arrival}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* STOPS */}
        {todayRoute && (
          <View style={[
            styles.card,
            { backgroundColor: theme.colors.option }
          ]}>
            <Text style={[
              styles.cardTitle,
              { color: theme.colors.text }
            ]}>
              Route Stops
            </Text>

            {todayRoute.stops.map((stop, index) => (
              <View key={index} style={styles.stopRow}>
                <View style={styles.timeline}>
                  <View style={[
                    styles.dot,
                    { backgroundColor: theme.colors.icon }
                  ]} />
                  {index !== todayRoute.stops.length - 1 && (
                    <View style={[
                      styles.line,
                      { backgroundColor: theme.colors.icon }
                    ]} />
                  )}
                </View>

                <Text style={[
                  styles.stopText,
                  { color: theme.colors.text }
                ]}>
                  {stop.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* MAP */}
        {todayRoute && (
          <View style={[
            styles.card,
            { backgroundColor: theme.colors.option }
          ]}>
            <Text style={[
              styles.cardTitle,
              { color: theme.colors.text }
            ]}>
              Route Map
            </Text>

            <MapView
              style={styles.map}
              initialRegion={{
                latitude: todayRoute.stops[0].lat,
                longitude: todayRoute.stops[0].lng,
                latitudeDelta: 0.25,
                longitudeDelta: 0.25,
              }}
            >
              {todayRoute.stops.map((stop, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: stop.lat,
                    longitude: stop.lng,
                  }}
                  title={stop.name}
                  pinColor="red"
                />
              ))}

              <Polyline
                coordinates={todayRoute.stops.map(stop => ({
                  latitude: stop.lat,
                  longitude: stop.lng,
                }))}
                strokeWidth={4}
                strokeColor={theme.colors.icon}
              />
            </MapView>
          </View>
        )}

        {/* BUTTON */}
        {todayRoute && (
          <TouchableOpacity
            style={[
              styles.trackButton,
              { backgroundColor: theme.colors.primary }
            ]}
          >
            <Icon name="location-outline" size={20} color="white" />
            <Text style={styles.trackText}>Track Live Bus</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

export default MyArrivalRoute;

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
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
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
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  noBusText: {
    fontSize: 15,
    fontStyle: 'italic',
  },

  map: {
    height: 180,
    borderRadius: 10,
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  timeline: {
    alignItems: 'center',
    width: 20,
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
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '600',
  },

  trackButton: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  trackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
