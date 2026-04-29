import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

const DeleteBus = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [buses, setBuses] = useState([]);

  const fetchBuses = () => {
    fetch('http://192.168.100.100:5000/buses')
      .then(res => res.json())
      .then(data => setBuses(data))
      .catch(err => console.log(err));
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this bus?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const res = await fetch(
                `http://192.168.100.100:5000/delete-bus/${id}`,
                { method: 'DELETE' }
              );

              const data = await res.json();

              if (res.ok) {
                Alert.alert("Success", data.message);
                fetchBuses(); // 🔥 refresh list
              } else {
                Alert.alert("Error", data.message);
              }
            } catch (err) {
              Alert.alert("Error", "Server error");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Delete Bus</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.list}>
        {buses.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>
            No buses found
          </Text>
        ) : (
          buses.map(item => (
            <View key={item.id} style={styles.card}>
              
              <Text style={styles.busNumber}>{item.bus_number}</Text>

              <Text>Driver: {item.driver_name || 'N/A'}</Text>

              <Text>
                Route: {item.source} → {item.destination}
              </Text>

              <Text>Capacity: {item.capacity}</Text>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Icon name="trash-outline" size={18} color="#fff" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default DeleteBus;

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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  list: {
    padding: 15,
  },

  card: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
    elevation: 3,
  },

  busNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  deleteBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },

  deleteText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});