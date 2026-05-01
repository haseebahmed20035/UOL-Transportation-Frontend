import React, { useState, useContext, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { useEffect } from 'react';

const GOOGLE_API_KEY = 'AIzaSyBG_tfwPfE3Bnn2-8CwNTOZuPd1c0Yr0Wc';

const AddRoutes = ({ navigation }) => {
  const mapRef = useRef(null);
  const { theme } = useContext(ThemeContext);
  const [routeName, setRouteName] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [time, setTime] = useState('');

  const [stops, setStops] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [loading, setLoading] = useState(false);

  // 🔥 MAP CLICK
  const handleMapPress = async e => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`,
      );

      const data = await res.json();
      const address = data.results[0]?.formatted_address || 'Unknown Location';

      const newStop = {
        stop_name: address,
        latitude,
        longitude,
      };

      // ❗ prevent duplicate
      const exists = stops.some(
        s => s.latitude === latitude && s.longitude === longitude,
      );

      if (exists) {
        Alert.alert('Already added');
        return;
      }

      setStops(prev => [...prev, newStop]);

      // optional: move camera
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // 🔥 ADD STOP
  const handleAddStop = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Tap on map first');
      return;
    }

    setStops(prev => [
      ...prev,
      {
        stop_name: selectedLocation.name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
    ]);

    setSelectedLocation(null);
  };

  // 🔥 REMOVE STOP
  const removeStop = index => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!source || !destination || stops.length === 0) {
      Alert.alert('Error', 'Fill all fields and add stops');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://192.168.100.100:5000/add-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_name: routeName,
          source,
          destination,
          estimated_time: time,
          stops,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert('Success', data.message);
        setRouteName('');
        setSource('');
        setDestination('');
        setTime('');
        setStops([]);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (err) {
      Alert.alert('Error', 'Server error');
    }

    setLoading(false);
  };
  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // km
  };
  const calculateEstimatedTime = () => {
    if (stops.length < 2) return;

    let totalDistance = 0;

    for (let i = 0; i < stops.length - 1; i++) {
      const s1 = stops[i];
      const s2 = stops[i + 1];

      totalDistance += getDistanceInKm(
        s1.latitude,
        s1.longitude,
        s2.latitude,
        s2.longitude,
      );
    }

    // 🚌 assume avg speed = 30 km/h (city traffic)
    const travelTimeMinutes = (totalDistance / 30) * 60;

    // ⏱️ stop delay (5 min each)
    const stopDelay = (stops.length - 1) * 5;

    const totalTime = Math.round(travelTimeMinutes + stopDelay);

    setTime(`${totalTime} mins`);
  };
  useEffect(() => {
    calculateEstimatedTime();
  }, [stops]);

  useEffect(() => {
    if (stops.length > 0) {
    }
  }, [stops]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Add Route</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {/* INPUTS */}
        <TextInput
          placeholder="Route Name (e.g. UOL Morning Route)"
          value={routeName}
          onChangeText={setRouteName}
          style={styles.input}
        />
        <TextInput
          placeholder="Source"
          value={source}
          onChangeText={setSource}
          style={styles.input}
        />

        <TextInput
          placeholder="Destination"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
        />

        {/* 🔥 ROUTE PREVIEW */}
        {source && destination && (
          <View style={styles.routePreview}>
            <View style={styles.locationBox}>
              <Icon name="location" size={16} color="#2ecc71" />
              <Text style={styles.locationText}>{source}</Text>
            </View>

            <Icon
              name="swap-horizontal-outline"
              size={22}
              color={theme.colors.primary}
              style={{ marginHorizontal: 10 }}
            />

            <View style={styles.locationBox}>
              <Icon name="flag-outline" size={16} color="#e74c3c" />
              <Text style={styles.locationText}>{destination}</Text>
            </View>
          </View>
        )}

        <TextInput
          placeholder="Estimated Time"
          value={time}
          editable={false} // 🔥 important
          style={[styles.input, { backgroundColor: '#f1f3f6' }]}
        />

        {/* 🔥 SEARCH BAR
        <View style={styles.searchWrapper}>
          <GooglePlacesAutocomplete
            placeholder="Search places"
            fetchDetails={true}
            // keep these (prevent earlier crashes)
            predefinedPlaces={[]}
            textInputProps={{ onFocus: () => {}, onBlur: () => {} }}
            listViewDisplayed="auto"
            minLength={2}
            debounce={400}
            query={{
              key: GOOGLE_API_KEY,
              language: 'en',
              types: 'geocode', // cities/areas + addresses
            }}
            onPress={(data, details = null) => {
              if (!details) return;

              const { lat, lng } = details.geometry.location;

              setSelectedLocation({
                latitude: lat,
                longitude: lng,
                name: data.description,
              });

              mapRef.current?.animateToRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }}
            styles={{
              textInput: styles.searchInputModern,
              container: { flex: 0 },
              listView: styles.searchDropdown,
            }}
            enablePoweredByContainer={false}
          />

          <View style={styles.searchIconModern}>
            <Icon name="search" size={18} color="#666" />
          </View>
        </View> */}

        {/* MAP */}
        <Text style={styles.section}>Tap map to add stop</Text>

        <MapView
          provider={PROVIDER_GOOGLE}
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 31.5204,
            longitude: 74.3587,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation
          showsMyLocationButton
          onPress={handleMapPress}
        >
          {selectedLocation && <Marker coordinate={selectedLocation} />}

          {/* ALL STOPS */}
          {stops.map((s, i) => (
            <Marker
              key={i}
              coordinate={{
                latitude: parseFloat(s.latitude),
                longitude: parseFloat(s.longitude),
              }}
              title={s.stop_name}
              pinColor="blue"
            />
          ))}
        </MapView>

        {/* SELECTED */}
        {selectedLocation && (
          <View style={styles.selectedBox}>
            <Text style={{ marginBottom: 5 }}>{selectedLocation.name}</Text>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddStop}>
              <Text style={{ color: '#fff' }}>Add Stop</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STOP LIST */}
        {stops.map((stop, index) => (
          <View key={index} style={styles.stopCard}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1}>{stop.stop_name}</Text>
              <Text style={{ fontSize: 12 }}>
                {stop.latitude}, {stop.longitude}
              </Text>
            </View>

            <TouchableOpacity onPress={() => removeStop(index)}>
              <Icon name="trash" size={18} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {loading ? 'Saving...' : 'Save Route'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AddRoutes;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  section: {
    fontWeight: 'bold',
    marginTop: 10,
  },

  map: {
    height: 260,
    marginVertical: 10,
    borderRadius: 12,
  },

  selectedBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  addBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },

  submitBtn: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 12,
  },

  searchIcon: {
    marginRight: 6,
  },

  searchInput: {
    fontSize: 14,
    color: '#000',
    backgroundColor: 'transparent',
  },

  searchList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 12,
    zIndex: 1000,
  },

  searchInputModern: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingLeft: 40,
    height: 48,
    fontSize: 14,
    elevation: 5,
  },

  searchIconModern: {
    position: 'absolute',
    left: 12,
    top: 14,
  },

  searchDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    elevation: 6,
  },
  routePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '40%',
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
