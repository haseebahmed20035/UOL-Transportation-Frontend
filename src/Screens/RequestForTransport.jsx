import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const routes = [
  'Johar Town Route',
  'Valencia Route',
  'Canal Route',
  'DHA Route',
];

const RequestForTransport = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const selectRoute = async route => {
    await AsyncStorage.setItem('transportStatus', 'pending');
    await AsyncStorage.setItem('selectedRoute', route);

    alert('Request sent to admin for approval');

    navigation.goBack();
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
          Request For Transport
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text },
          ]}
        >
          Select Your Route
        </Text>

        {routes.map((route, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.routeCard,
              { backgroundColor: theme.colors.option },
            ]}
            onPress={() => selectRoute(route)}
          >
            <Icon
              name="bus-outline"
              size={22}
              color={theme.colors.icon}
            />

            <Text
              style={[
                styles.routeText,
                { color: theme.colors.text },
              ]}
            >
              {route}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default RequestForTransport;

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

  body: {
    padding: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    gap: 10,
  },

  routeText: {
    fontSize: 15,
    fontWeight: '600',
  },
});