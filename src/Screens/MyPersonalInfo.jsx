import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { routesByDay, getTodayId } from '../data/RouteModel';
import { ThemeContext } from '../context/ThemeContext';

const MyPersonalInfo = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const todayId = getTodayId();
  const todayRoute = routesByDay[todayId];

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoBlock}>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>
        {value}
      </Text>

      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border },
        ]}
      />
    </View>
  );

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
          My Personal Information
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {/* BODY */}
      <View style={styles.wrapper}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.option },
          ]}
        >
          <InfoRow label="Full Name" value="Haseeb Ahmed" />
          <InfoRow label="Registration No" value="70135821" />
          <InfoRow
            label="Email Address"
            value="70135821@student.uol.edu.pk"
          />
          <InfoRow
            label="My Route"
            value={todayRoute?.arrival?.title || 'Not Assigned'}
          />
        </View>
      </View>
    </View>
  );
};

export default MyPersonalInfo;

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
    fontSize: 18,
    fontWeight: 'bold',
  },

  wrapper: {
    padding: 20,
  },

  card: {
    padding: 20,
    borderRadius: 14,
    elevation: 3,
  },

  infoBlock: {
    marginBottom: 10,
  },

  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
  },

  divider: {
    height: 1,
    marginTop: 10,
  },
});