import React, { useEffect, useState, useContext } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const DeleteRoutes = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch routes
  const fetchRoutes = async () => {
    try {
      const res = await fetch('http://192.168.100.100:5000/routes');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to load routes');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // 🔥 Delete route
  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Route',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(
                `http://192.168.100.100:5000/delete-route/${id}`,
                { method: 'DELETE' }
              );

              const data = await res.json();

              if (res.ok) {
                Alert.alert('Success', data.message);
                fetchRoutes(); // 🔥 refresh
              } else {
                Alert.alert('Error', data.message);
              }
            } catch (err) {
              Alert.alert('Error', 'Server error');
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

        <Text style={styles.headerText}>Delete Routes</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.center}>
          <Text>No routes available</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 15 }}>
          {routes.map((item) => (
            <View key={item.id} style={styles.card}>
              
              {/* ROUTE INFO */}
              <View style={{ flex: 1 }}>
                <Text style={styles.routeTitle}>🛣️ {item.route_name}</Text>

                {/* SOURCE ⇄ DESTINATION */}
                <View style={styles.routeFlow}>
                  <Text style={styles.location}>{item.source}</Text>

                  <Icon
                    name="swap-horizontal-outline"
                    size={20}
                    color={theme.colors.primary}
                  />

                  <Text style={styles.location}>{item.destination}</Text>
                </View>

                <Text style={styles.meta}>🕒 {item.estimated_time}</Text>
              </View>

              {/* DELETE BUTTON */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.route_name)}
              >
                <Icon name="trash" size={20} color="#fff" />
              </TouchableOpacity>

            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default DeleteRoutes;

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

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
    alignItems: 'center',
  },

  routeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  routeFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  location: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  meta: {
    fontSize: 12,
    color: '#555',
  },

  deleteBtn: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});