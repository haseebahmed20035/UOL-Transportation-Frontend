import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

const MyRoute = ({ navigation }) => {

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
          <Icon name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>My Route</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>

        {/* Arrival Button */}
        <TouchableOpacity
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.box,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => navigation.navigate('MyArrivalRoute')}
        >
          <Icon name="log-in-outline" size={28} color={theme.colors.icon} />

          <Text
            style={[
              styles.boxText,
              { color: theme.colors.text },
            ]}
          >
            My Arrival Route
          </Text>
        </TouchableOpacity>

        {/* Departure Button */}
        <TouchableOpacity
          style={[
            styles.box,
            {
              backgroundColor: theme.colors.box,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => navigation.navigate('MyDepartureRoute')}
        >
          <Icon name="log-out-outline" size={28} color={theme.colors.icon} />

          <Text
            style={[
              styles.boxText,
              { color: theme.colors.text },
            ]}
          >
            My Departure Route
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default MyRoute;

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

  content: {
    paddingVertical: 30,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  box: {
    width: '45%',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 25,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
  },

  boxText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});