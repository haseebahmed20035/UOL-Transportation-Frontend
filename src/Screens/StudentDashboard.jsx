import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TextInput,
} from 'react-native';
import React, { useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const StudentDashboard = ({ navigation }) => {

  const { theme } = useContext(ThemeContext);

  const [menuVisible, setMenuVisible] = useState(false);
  const [recentScreens, setRecentScreens] = useState([]);
  const [searchText, setSearchText] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const navigateAndTrack = async (screenName) => {
    const time = new Date().toLocaleTimeString();

    const updated = [
      { name: screenName, time },
      ...recentScreens.filter(s => s.name !== screenName),
    ].slice(0, 5);

    setRecentScreens(updated);
    await AsyncStorage.setItem('recentScreens', JSON.stringify(updated));

    navigation.navigate(screenName);
  };

  const appScreens = [
    'MyRoute',
    'AllRoutes',
    'BusSchedule',
    'LiveBusTracking',
    'ChangeRoute',
    'RequestForTransport',
  ];

  const filteredScreens = appScreens.filter(screen =>
    screen.toLowerCase().includes(searchText.toLowerCase())
  );
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
     <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity>
          <Icon name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={require('../Images/uol.png')} style={styles.logo} />
          <Text style={styles.headerText}>UOL Transportation</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Icon name="help-circle-outline" size={26} color="white" />
          </TouchableOpacity>

          <TouchableOpacity>
            <Icon name="notifications-outline" size={26} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatar}
            onPress={() => {
              setMenuVisible(!menuVisible);
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Text style={styles.avatarText}>H</Text>
          </TouchableOpacity>
        </View>
      </View>
      {menuVisible && (
        <Animated.View
          style={[
            styles.dropdownMenu,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
          ]}
        >
          {/* PROFILE HEADER */}
          <View style={styles.profileSection}>
            <View style={styles.profileCircle}>
              <Text style={{ color: '#175812', fontWeight: 'bold' }}>H</Text>
            </View>
            <Text style={styles.profileName}>Haseeb</Text>
          </View>

          <View style={styles.divider} />

          {/* HELP */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              navigateAndTrack('Help');
            }}
          >
            <Icon name="help-circle-outline" size={22} color="#175812" />
            <Text style={styles.menuText}>Help Center</Text>
          </TouchableOpacity>

          {/* SETTINGS */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              navigateAndTrack('AppSettings');
            }}
          >
            <Icon name="settings-outline" size={22} color="#175812" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* RECENT */}
          <Text style={styles.sectionTitle}>Recent Activities</Text>

          <View style={styles.recentContainer}>
            {recentScreens.length === 0 ? (
              <Text style={{ fontSize: 12 }}>No Activity</Text>
            ) : (
              recentScreens.map((item, index) => (
                <View key={index} style={styles.activityChip}>
                  <Text style={{ fontSize: 11 }}>{item.name}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.divider} />

          {/* FINDER */}
          <Text style={styles.sectionTitle}>App Finder</Text>

          <View style={styles.searchWrapper}>
            <Icon name="search" size={16} color="gray" />
            <TextInput
              placeholder="Search screen..."
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchBox}
            />
          </View>

          {filteredScreens.map((screen, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuRow}
              onPress={() => navigateAndTrack(screen)}
            >
              <Text style={styles.menuText}>🔍 {screen}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          {/* SIGN OUT */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                {
                  text: 'No',
                  style: 'cancel',
                },
                {
                  text: 'Yes',
                  onPress: () => navigation.replace('Login'),
                },
              ]);
            }}
          >
            <Icon name="log-out-outline" size={22} color="white" />
            <Text style={{ color: 'white', marginLeft: 6 }}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ROUTE INFORMATION */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.text },
            ]}
          >
            Route Information
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('MyRoute');
              }}
            >
              <Icon name="navigate-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text },
                ]}
              >
                My Route
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('AllRoutes');
              }}
            >
              <Icon name="map-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                All Routes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('BusSchedule');
              }}
            >
              <Icon name="calendar-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Bus Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('LiveBusTracking');
              }}
            >
              <Icon name="bus-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Live Bus Tracking
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('ChangeRoute');
              }}
            >
              <Icon name="swap-horizontal-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Change Route
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('RequestForTransport');
              }}
            >
              <Icon name="document-text-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Request For Transport
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PERSONAL DETAILS */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.text },
            ]}
          >
            Personal Details
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('MyPersonalInfo');
              }}
            >
              <Icon name="person-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                My Personal Information
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('FeeVoucher');
              }}
            >
              <Icon name="receipt-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Fee Voucher
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* APP SETTINGS */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.text },
            ]}
          >
            App Settings
          </Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('AppSettings');
              }}
            >
              <Icon name="settings-outline" size={26} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                App Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.box,
                {
                  backgroundColor: theme.colors.box,
                    borderColor: theme.colors.border,
                },
              ]}
              onPress={() => {
                navigateAndTrack('Help');
              }}
            >
              <Icon name="help-circle-outline" size={30} color={theme.colors.icon} />
              <Text
                style={[
                  styles.boxText,
                  { color: theme.colors.text},
                ]}
              >
                Help
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default StudentDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F6',
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    backgroundColor: '#175812',
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  logo: {
    height: 30,
    width: 30,
    resizeMode: 'contain',
  },

  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    backgroundColor: 'white',
    height: 30,
    width: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontWeight: 'bold',
    color: '#175812',
  },

  /* CONTENT */
  scrollContainer: {
    padding: 12,
  },

  card: {
    backgroundColor: 'white',
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#175812',
  },

  /* GRID */
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  box: {
    width: '48%',
    backgroundColor: '#7FAF8A',
    borderColor: 'rgba(26,128,63,0.5)',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },

  boxText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F2F1B',
    textAlign: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#fff',
    width: 220,
    borderRadius: 12,
    padding: 10,
    elevation: 5,
    zIndex: 999,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },

  menuText: {
    fontSize: 14,
  },

  menuHeading: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 5,
    marginVertical: 5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 8,
  },

  profileCircle: {
    height: 40,
    width: 40,
    backgroundColor: '#E6F2EA',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileName: {
    fontWeight: 'bold',
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 6,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },

  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    marginVertical: 4,
    color: '#175812',
  },

  recentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },

  activityChip: {
    backgroundColor: '#E6F2EA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 6,
  },

  searchBox: {
    flex: 1,
    paddingVertical: 3,
    marginLeft: 4,
  },

  signOutBtn: {
    backgroundColor: '#D9534F',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
});
