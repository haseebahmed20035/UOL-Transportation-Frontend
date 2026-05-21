import React, { useContext, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import notifee, { AndroidImportance } from "@notifee/react-native";
import { ThemeContext } from "../context/ThemeContext";
import { BASE_URL } from '../services/baseUrl'

const NEAR_STOP_DISTANCE_METERS = 300;
const LOCATION_REFRESH_INTERVAL = 5000;

const LiveBusTracking = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const mapRef = useRef(null);
  const notificationSentRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [refreshingLocation, setRefreshingLocation] = useState(false);

  const [busData, setBusData] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [studentStop, setStudentStop] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [distanceToStop, setDistanceToStop] = useState(null);

  useEffect(() => {
    setupNotificationPermission();
    fetchLiveBusTracking(true);

    const interval = setInterval(() => {
      fetchLiveBusTracking(false);
    }, LOCATION_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const setupNotificationPermission = async () => {
    try {
      await notifee.requestPermission();

      if (Platform.OS === "android") {
        await notifee.createChannel({
          id: "bus_tracking",
          name: "Bus Tracking",
          importance: AndroidImportance.HIGH,
          sound: "default",
        });
      }
    } catch (error) {
      console.log("Notification permission error:", error);
    }
  };

  const showBusNearNotification = async (stopName) => {
    try {
      await notifee.displayNotification({
        title: "Bus is near your stop",
        body: `Your bus is near ${stopName || "your location"}. Please be ready.`,
        android: {
          channelId: "bus_tracking",
          smallIcon: "ic_launcher",
          pressAction: {
            id: "default",
          },
        },
      });
    } catch (error) {
      console.log("Notification error:", error);
    }
  };

  const fetchLiveBusTracking = async (showLoader) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshingLocation(true);
      }

      const storedUser = await AsyncStorage.getItem("user");

      if (!storedUser) {
        Alert.alert("Login Required", "Student data not found. Please login again.");
        setLoading(false);
        setRefreshingLocation(false);
        return;
      }

      const user = JSON.parse(storedUser);

      const studentId =
        user?.student_id ||
        user?.studentId ||
        user?.id ||
        user?.user_id ||
        user?.userId;

      if (!studentId) {
        Alert.alert("Error", "Student ID not found.");
        setLoading(false);
        setRefreshingLocation(false);
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/student/live-bus/${studentId}`
      );

      const data = response.data;

      if (!data || data.success === false) {
        setBusData(null);
        setBusLocation(null);
        setStudentStop(null);
        setRouteStops([]);
        setDistanceToStop(null);
        return;
      }

      const bus = data.bus || data.data?.bus || data;
      const stop = data.studentStop || data.data?.studentStop || data.stop;
      const stops = data.routeStops || data.data?.routeStops || [];

      const latitude = Number(bus.latitude || bus.current_latitude || bus.lat);
      const longitude = Number(bus.longitude || bus.current_longitude || bus.lng);

      const stopLatitude = Number(stop?.latitude || stop?.lat);
      const stopLongitude = Number(stop?.longitude || stop?.lng);

      if (!latitude || !longitude) {
        setBusData(bus);
        setBusLocation(null);
        setStudentStop(stop || null);
        setRouteStops(stops);
        return;
      }

      const updatedBusLocation = {
        latitude,
        longitude,
      };

      setBusData(bus);
      setBusLocation(updatedBusLocation);
      setRouteStops(Array.isArray(stops) ? stops : []);

      if (stopLatitude && stopLongitude) {
        const updatedStudentStop = {
          ...stop,
          latitude: stopLatitude,
          longitude: stopLongitude,
        };

        setStudentStop(updatedStudentStop);

        const distance = calculateDistanceInMeters(
          latitude,
          longitude,
          stopLatitude,
          stopLongitude
        );

        setDistanceToStop(distance);

        if (
          distance <= NEAR_STOP_DISTANCE_METERS &&
          notificationSentRef.current === false
        ) {
          notificationSentRef.current = true;
          showBusNearNotification(updatedStudentStop.stop_name || updatedStudentStop.name);
        }

        if (distance > NEAR_STOP_DISTANCE_METERS + 200) {
          notificationSentRef.current = false;
        }
      }

      animateMapToBus(updatedBusLocation);
    } catch (error) {
      console.log("Live tracking error:", error?.response?.data || error.message);

      if (showLoader) {
        Alert.alert(
          "Error",
          "Unable to load live bus tracking. Please check your internet or backend."
        );
      }
    } finally {
      setLoading(false);
      setRefreshingLocation(false);
    }
  };

  const animateMapToBus = (location) => {
    if (!mapRef.current || !location) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      800
    );
  };

  const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadius = 6371000;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  };

  const toRadians = (value) => {
    return (value * Math.PI) / 180;
  };

  const formatDistance = (meters) => {
    if (meters === null || meters === undefined) return "Calculating...";

    if (meters < 1000) {
      return `${Math.round(meters)} meters away`;
    }

    return `${(meters / 1000).toFixed(1)} km away`;
  };

  const getApproxArrivalTime = () => {
    if (!distanceToStop) return "Calculating...";

    const averageBusSpeedMetersPerMinute = 350;
    const minutes = Math.max(
      1,
      Math.round(distanceToStop / averageBusSpeedMetersPerMinute)
    );

    return `${minutes} mins`;
  };

  const getRouteCoordinates = () => {
    const coordinates = [];

    routeStops.forEach((stop) => {
      const lat = Number(stop.latitude || stop.lat);
      const lng = Number(stop.longitude || stop.lng);

      if (lat && lng) {
        coordinates.push({
          latitude: lat,
          longitude: lng,
        });
      }
    });

    return coordinates;
  };

  const isRideActive =
    busData?.ride_status === "active" ||
    busData?.status === "active" ||
    busData?.is_active === 1 ||
    busData?.is_active === true ||
    busData?.is_running === 1 ||
    busData?.is_running === true;

  const routeTitle =
    busData?.route_name ||
    `${busData?.source || "UOL"} → ${busData?.destination || "Destination"}`;

  const busNumber =
    busData?.bus_number || busData?.bus_no || busData?.number || "Not Assigned";

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading live bus tracking...
        </Text>
      </View>
    );
  }

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
          <Icon name="arrow-back" size={24} color={theme.colors.background} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            { color: theme.colors.background },
          ]}
        >
          Live Bus Tracking
        </Text>

        <TouchableOpacity onPress={() => fetchLiveBusTracking(false)}>
          {refreshingLocation ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Icon name="refresh" size={23} color={theme.colors.background} />
          )}
        </TouchableOpacity>
      </View>

      {!busLocation ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconBox,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <Icon name="bus-outline" size={42} color={theme.colors.primary} />
          </View>

          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No active bus tracking
          </Text>

          <Text style={[styles.emptyMessage, { color: theme.colors.icon }]}>
            Your assigned bus is not live right now. When the driver starts the
            ride, you will see the bus location here.
          </Text>

          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => fetchLiveBusTracking(true)}
          >
            <Icon name="refresh" size={18} color="#fff" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* MAP */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: busLocation.latitude,
              longitude: busLocation.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsTraffic={true}
          >
            {/* Route Line */}
            {getRouteCoordinates().length > 1 && (
              <Polyline
                coordinates={getRouteCoordinates()}
                strokeWidth={4}
                strokeColor={theme.colors.primary}
              />
            )}

            {/* Bus Marker */}
            <Marker coordinate={busLocation} title="Your Bus">
              <View style={styles.busMarker}>
                <Icon name="bus" size={24} color="#fff" />
              </View>
            </Marker>

            {/* Student Stop Marker */}
            {studentStop && (
              <Marker
                coordinate={{
                  latitude: studentStop.latitude,
                  longitude: studentStop.longitude,
                }}
                title={studentStop.stop_name || studentStop.name || "Your Stop"}
                description="Your pickup/drop location"
              >
                <View style={styles.stopMarker}>
                  <Icon name="location" size={22} color="#fff" />
                </View>
              </Marker>
            )}

            {/* Other Route Stops */}
            {routeStops.map((stop, index) => {
              const lat = Number(stop.latitude || stop.lat);
              const lng = Number(stop.longitude || stop.lng);

              if (!lat || !lng) return null;

              return (
                <Marker
                  key={`stop-${index}`}
                  coordinate={{
                    latitude: lat,
                    longitude: lng,
                  }}
                  title={stop.stop_name || stop.name || `Stop ${index + 1}`}
                >
                  <View style={styles.smallStopMarker}>
                    <Text style={styles.smallStopText}>{index + 1}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <ScrollView
            style={styles.bottomSheet}
            showsVerticalScrollIndicator={false}
          >
            {/* ROUTE CARD */}
            <View
              style={[
                styles.routeCard,
                { backgroundColor: theme.colors.option },
              ]}
            >
              <View style={styles.routeTopRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.routeTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    {routeTitle}
                  </Text>

                  <Text
                    style={[
                      styles.routeSubtitle,
                      { color: theme.colors.icon },
                    ]}
                  >
                    {studentStop?.stop_name || studentStop?.name
                      ? `Your stop: ${studentStop.stop_name || studentStop.name}`
                      : "Your stop is not available"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.liveBadge,
                    {
                      backgroundColor: isRideActive ? "#E8F8EF" : "#F2F2F2",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.liveDot,
                      {
                        backgroundColor: isRideActive ? "#1FA463" : "#999",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.liveBadgeText,
                      {
                        color: isRideActive ? "#1FA463" : "#777",
                      },
                    ]}
                  >
                    {isRideActive ? "Live" : "Inactive"}
                  </Text>
                </View>
              </View>

              {/* Bus Number Badge */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.box },
                ]}
              >
                <Icon name="bus-outline" size={16} color={theme.colors.text} />
                <Text
                  style={[
                    styles.badgeText,
                    { color: theme.colors.text },
                  ]}
                >
                  Bus No: {busNumber}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: theme.colors.box },
                  ]}
                >
                  <Icon name="time-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.infoLabel, { color: theme.colors.icon }]}>
                    Arrives in
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {getApproxArrivalTime()}
                  </Text>
                </View>

                <View
                  style={[
                    styles.infoBox,
                    { backgroundColor: theme.colors.box },
                  ]}
                >
                  <Icon name="navigate-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.infoLabel, { color: theme.colors.icon }]}>
                    Distance
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {formatDistance(distanceToStop)}
                  </Text>
                </View>
              </View>

              {distanceToStop !== null &&
                distanceToStop <= NEAR_STOP_DISTANCE_METERS && (
                  <View style={styles.nearAlertBox}>
                    <Icon name="notifications" size={20} color="#B45309" />
                    <Text style={styles.nearAlertText}>
                      Your bus is near your stop. Please be ready.
                    </Text>
                  </View>
                )}
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

export default LiveBusTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerText: {
    fontSize: 17,
    fontWeight: "bold",
  },

  map: {
    flex: 1,
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: 260,
  },

  /* ROUTE CARD */
  routeCard: {
    margin: 14,
    padding: 14,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  routeTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  routeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 3,
  },

  routeSubtitle: {
    fontSize: 12.5,
    fontWeight: "500",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    marginRight: 5,
  },

  liveBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  infoBox: {
    width: "48%",
    borderRadius: 14,
    padding: 12,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },

  nearAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },

  nearAlertText: {
    flex: 1,
    color: "#92400E",
    fontSize: 12.5,
    fontWeight: "700",
    marginLeft: 8,
  },

  busMarker: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: "#175812",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  stopMarker: {
    width: 40,
    height: 40,
    borderRadius: 22,
    backgroundColor: "#E11D48",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  smallStopMarker: {
    width: 26,
    height: 26,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  smallStopText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  emptyIconBox: {
    width: 82,
    height: 82,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },

  emptyMessage: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },

  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 7,
  },
});