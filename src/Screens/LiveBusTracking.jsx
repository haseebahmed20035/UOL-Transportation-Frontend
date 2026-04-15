import React, { useContext } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { ThemeContext } from "../context/ThemeContext";

const LiveBusTracking = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

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
          <Icon name="arrow-back" size={24} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            { color: theme.colors.icon },
          ]}
        >
          Live Bus Tracking
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {/* ROUTE CARD */}
      <View
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
          UOL → Johar Town
        </Text>

        {/* Bus Number Badge */}
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.colors.box },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: theme.colors.text },
            ]}
          >
            Bus No: UOL-07
          </Text>
        </View>

        {/* Arrival Time */}
        <View style={styles.arrivalRow}>
          <Icon
            name="time-outline"
            size={18}
            color={theme.colors.icon}
          />
          <Text
            style={[
              styles.arrivalText,
              { color: theme.colors.text },
            ]}
          >
            Arrives in: 12 mins
          </Text>
        </View>
      </View>

      {/* MAP PLACEHOLDER */}
      <View
        style={[
          styles.mapContainer,
          { backgroundColor: theme.colors.border },
        ]}
      >
        <Text style={{ color: theme.colors.text }}>
          Google Map will appear here...
        </Text>
      </View>

      {/* FLOATING BUTTON */}
      <TouchableOpacity
        style={[
          styles.floatingBtn,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Icon name="navigate-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default LiveBusTracking;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  /* ROUTE CARD */
  routeCard: {
    margin: 14,
    padding: 14,
    borderRadius: 12,
    elevation: 3,
  },

  routeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },

  arrivalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  arrivalText: {
    fontSize: 14,
    fontWeight: "600",
  },

  /* MAP AREA */
  mapContainer: {
    flex: 1,
    marginHorizontal: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  /* FLOATING BUTTON */
  floatingBtn: {
    position: "absolute",
    bottom: 25,
    right: 25,
    height: 55,
    width: 55,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});