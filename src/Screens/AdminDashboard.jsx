import {
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import React, {
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import Icon from 'react-native-vector-icons/Ionicons';

import AsyncStorage
from '@react-native-async-storage/async-storage';

import { ThemeContext }
from '../context/ThemeContext';

const AdminDashboard = ({navigation}) => {
const [stats, setStats] = useState(null);
  const { theme } =
    useContext(ThemeContext);

  const [menuVisible,
    setMenuVisible] =
      useState(false);

  const [recentScreens,
    setRecentScreens] =
      useState([]);

  const [searchText,
    setSearchText] =
      useState('');

  const [refreshing,
    setRefreshing] =
      useState(false);

  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;
  

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent =
    async () => {

      const stored =
        await AsyncStorage.getItem(
          'recentScreens'
        );

      if (stored) {

        setRecentScreens(
          JSON.parse(stored)
        );
      }
    };

  const onRefresh =
    async () => {

      setRefreshing(true);

      await loadRecent();

      setRefreshing(false);
    };

  const navigateAndTrack =
    async screenName => {

      const time =
        new Date()
          .toLocaleTimeString();

      const updated = [
        {
          name: screenName,
          time,
        },

        ...recentScreens.filter(
          s =>
            s.name !==
            screenName
        ),
      ].slice(0, 5);

      setRecentScreens(updated);

      await AsyncStorage.setItem(
        'recentScreens',
        JSON.stringify(updated)
      );

      navigation.navigate(
        screenName
      );
    };

  const menuAnimation =
    () => {

      setMenuVisible(
        !menuVisible
      );

      Animated.timing(
        fadeAnim,
        {
          toValue:
            menuVisible
              ? 0
              : 1,

          duration: 250,

          useNativeDriver:
            true,
        }
      ).start();
    };

  const quickActions = [
    {
      title:
        'Manage Buses',

      icon:
        'bus',

      color:
        '#4CAF50',

      screen:
        'ManageBuses',
    },

    {
      title:
        'Manage Routes',

      icon:
        'map',

      color:
        '#2196F3',

      screen:
        'ManageRoutes',
    },

    {
      title:
        'Students',

      icon:
        'people',

      color:
        '#9C27B0',

      screen:
        'StudentManage',
    },

    {
      title:
        'Drivers',

      icon:
        'person',

      color:
        '#FF9800',

      screen:
        'ManageDrivers',
    },

    {
      title:
        'Requests',

      icon:
        'clipboard',

      color:
        '#E91E63',

      screen:
        'StudentsReq',
    },

    {
      title:
        'Complaints',

      icon:
        'chatbox',

      color:
        '#F44336',

      screen:
        'StudentComplaints',
    },

    {
      title:
        'Live Tracking',

      icon:
        'locate',

      color:
        '#009688',

      screen:
        'AllLiveTracking',
    },

    {
      title:
        'Notifications',

      icon:
        'notifications',

      color:
        '#3F51B5',

      screen:
        'SendNotification',
    },
  ];

  const filteredScreens =
    quickActions.filter(
      item =>
        item.title
          .toLowerCase()
          .includes(
            searchText.toLowerCase()
          )
    );

const fetchDashboardStats =
  async () => {

    try {

      const res =
        await fetch(
          'http://192.168.100.100:5000/admin-dashboard-stats'
        );

      const data =
        await res.json();

      console.log(
        'ADMIN STATS:',
        data
      );

      setStats(data.stats);

    } catch (err) {

      console.log(err);
    }
  };
  useEffect(() => {

  loadRecent();

  fetchDashboardStats();

}, []);
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            '#f5f7fb',
        },
      ]}>

      <StatusBar
        backgroundColor={
          theme.colors.primary
        }
        barStyle="light-content"
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme.colors.primary,
          },
        ]}>

        <View style={styles.headerLeft}>

          <Image
            source={require('../Images/uol.png')}
            style={styles.logo}
          />

          <View>

            <Text style={styles.headerTitle}>
              Admin Dashboard
            </Text>

            <Text style={styles.headerSub}>
              UOL Transportation
            </Text>

          </View>

        </View>

        <View style={styles.headerRight}>

          <TouchableOpacity
            style={styles.notificationBtn}>

            <Icon
              name="notifications-outline"
              size={24}
              color="white"
            />

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatar}
            onPress={
              menuAnimation
            }>

            <Text
              style={
                styles.avatarText
              }>
              A
            </Text>

          </TouchableOpacity>

        </View>

      </View>

      {/* DROPDOWN */}
      {menuVisible && (

        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity:
                fadeAnim,

              transform: [
                {
                  scale:
                    fadeAnim,
                },
              ],
            },
          ]}>

          <View
            style={
              styles.profileTop
            }>

            <View
              style={
                styles.profileCircle
              }>

              <Text
                style={
                  styles.profileCircleText
                }>
                A
              </Text>

            </View>

            <Text
              style={
                styles.profileName
              }>
              Admin
            </Text>

            <Text
              style={
                styles.profileRole
              }>
              Transport Manager
            </Text>

          </View>

          <TouchableOpacity
            style={
              styles.menuItem
            }
            onPress={() =>
              navigateAndTrack(
                'AppSettings'
              )
            }>

            <Icon
              name="settings-outline"
              size={20}
              color="#175812"
            />

            <Text
              style={
                styles.menuText
              }>
              Settings
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.menuItem
            }
            onPress={() =>
              navigateAndTrack(
                'Help'
              )
            }>

            <Icon
              name="help-circle-outline"
              size={20}
              color="#175812"
            />

            <Text
              style={
                styles.menuText
              }>
              Help Center
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.logoutBtn
            }
            onPress={() => {

              Alert.alert(
                'Logout',
                'Are you sure?',
                [
                  {
                    text:
                      'Cancel',

                    style:
                      'cancel',
                  },

                  {
                    text:
                      'Logout',

                    onPress:
                      () =>
                        navigation.replace(
                          'Login'
                        ),
                  },
                ]
              );
            }}>

            <Icon
              name="log-out-outline"
              size={20}
              color="white"
            />

            <Text
              style={
                styles.logoutText
              }>
              Logout
            </Text>

          </TouchableOpacity>

        </Animated.View>
      )}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={
              onRefresh
            }
          />
        }
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}>

        {/* WELCOME CARD */}
        <View
          style={
            styles.welcomeCard
          }>

          <View
            style={{
              flex: 1,
            }}>

            <Text
              style={
                styles.welcomeTitle
              }>
              Welcome Admin 👋
            </Text>

            <Text
              style={
                styles.welcomeSubtitle
              }>

              Manage transport
              operations, buses,
              drivers, complaints,
              live tracking and
              student requests.

            </Text>

            <View
              style={
                styles.activeChip
              }>

              <Icon
                name="radio-button-on"
                size={12}
                color="#4CAF50"
              />

              <Text
                style={
                  styles.activeChipText
                }>
                System Active
              </Text>

            </View>

          </View>

          <Image
            source={{
              uri:
                'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            }}
            style={
              styles.adminImage
            }
          />

        </View>

        {/* ANALYTICS */}
        <View
          style={
            styles.analyticsRow
          }>

          <View
            style={
              styles.analyticsCard
            }>

            <Icon
              name="bus"
              size={26}
              color="#4CAF50"
            />

            <Text
              style={
                styles.analyticsValue
              }>
              {stats?.total_buses || 0}
            </Text>

            <Text
              style={
                styles.analyticsLabel
              }>
              Active Buses
            </Text>

          </View>

          <View
            style={
              styles.analyticsCard
            }>

            <Icon
              name="people"
              size={26}
              color="#2196F3"
            />

            <Text
              style={
                styles.analyticsValue
              }>
              {stats?.total_students || 0}
            </Text>

            <Text
              style={
                styles.analyticsLabel
              }>
              Students
            </Text>

          </View>

        </View>

        <View
          style={
            styles.analyticsRow
          }>

          <View
            style={
              styles.analyticsCard
            }>

            <Icon
              name="person"
              size={26}
              color="#FF9800"
            />

            <Text
              style={
                styles.analyticsValue
              }>
              {stats?.total_drivers || 0}
            </Text>

            <Text
              style={
                styles.analyticsLabel
              }>
              Drivers
            </Text>

          </View>

          <View
            style={
              styles.analyticsCard
            }>

            <Icon
              name="alert-circle"
              size={26}
              color="#F44336"
            />

            <Text
              style={
                styles.analyticsValue
              }>
              {stats?.total_complaints || 0}
            </Text>

            <Text
              style={
                styles.analyticsLabel
              }>
              Complaints
            </Text>

          </View>

        </View>

        {/* LIVE STATUS */}
        <View
          style={
            styles.liveCard
          }>

          <View
            style={
              styles.liveTop
            }>

            <View>

              <Text
                style={
                  styles.liveTitle
                }>
                Live Operations
              </Text>

              <Text
                style={
                  styles.liveSub
                }>
                Transport Running
              </Text>

            </View>

            <View
              style={
                styles.liveBadge
              }>

              <Text
                style={
                  styles.liveBadgeText
                }>
                LIVE
              </Text>

            </View>

          </View>

          <View
            style={
              styles.operationRow
            }>

            <View
              style={
                styles.operationItem
              }>

              <Icon
                name="navigate"
                size={22}
                color="#2196F3"
              />

              <Text
                style={
                  styles.operationTitle
                }>
                Current Route
              </Text>

              <Text
                style={
                  styles.operationValue
                }>
                Canal Route
              </Text>

            </View>

            <View
              style={
                styles.operationItem
              }>

              <Icon
                name="time"
                size={22}
                color="#FF9800"
              />

              <Text
                style={
                  styles.operationTitle
                }>
                Trips Today
              </Text>

              <Text
                style={
                  styles.operationValue
                }>
                18
              </Text>

            </View>

          </View>

        </View>

        {/* QUICK ACTIONS */}
        <View
          style={
            styles.sectionHeader
          }>

          <Text
            style={
              styles.sectionTitle
            }>
            Quick Actions
          </Text>

        </View>

        <View style={styles.grid}>

          {quickActions.map(
            item => (

              <TouchableOpacity
                key={
                  item.title
                }
                style={
                  styles.actionCard
                }
                onPress={() =>
                  navigateAndTrack(
                    item.screen
                  )
                }>

                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        item.color,
                    },
                  ]}>

                  <Icon
                    name={
                      item.icon
                    }
                    size={28}
                    color="white"
                  />

                </View>

                <Text
                  style={
                    styles.actionTitle
                  }>
                  {item.title}
                </Text>

              </TouchableOpacity>
            )
          )}

        </View>

        {/* SEARCH */}
        <View
          style={
            styles.searchCard
          }>

          <View
            style={
              styles.searchWrapper
            }>

            <Icon
              name="search"
              size={18}
              color="gray"
            />

            <TextInput
              placeholder="Search feature..."
              value={
                searchText
              }
              onChangeText={
                setSearchText
              }
              style={
                styles.searchInput
              }
            />

          </View>

          {searchText !==
            '' && (

            filteredScreens.map(
              (
                item,
                index
              ) => (

                <TouchableOpacity
                  key={
                    index
                  }
                  style={
                    styles.searchResult
                  }
                  onPress={() =>
                    navigateAndTrack(
                      item.screen
                    )
                  }>

                  <Text
                    style={{
                      color:
                        '#111',
                    }}>

                    🔍{' '}
                    {
                      item.title
                    }

                  </Text>

                </TouchableOpacity>
              )
            )
          )}

        </View>

        {/* RECENT */}
        <View
          style={
            styles.sectionHeader
          }>

          <Text
            style={
              styles.sectionTitle
            }>
            Recent Activities
          </Text>

        </View>

        <View
          style={
            styles.recentCard
          }>

          {recentScreens.length ===
          0 ? (

            <Text
              style={
                styles.noRecentText
              }>
              No recent activities
            </Text>

          ) : (

            recentScreens.map(
              (
                item,
                index
              ) => (

                <View
                  key={
                    index
                  }
                  style={
                    styles.recentItem
                  }>

                  <Icon
                    name="time-outline"
                    size={18}
                    color="#175812"
                  />

                  <View>

                    <Text
                      style={
                        styles.recentText
                      }>
                      {item.name}
                    </Text>

                    <Text
                      style={{
                        color:
                          '#777',
                        fontSize: 11,
                        marginLeft: 10,
                        marginTop: 2,
                      }}>
                      {item.time}
                    </Text>

                  </View>

                </View>
              )
            )
          )}

        </View>

      </ScrollView>

    </View>
  );
};

export default AdminDashboard;

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },

    header: {
      paddingHorizontal: 18,
      paddingTop: 18,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    logo: {
      width: 38,
      height: 38,
      resizeMode:
        'contain',
      marginRight: 10,
    },

    headerTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight:
        'bold',
    },

    headerSub: {
      color: '#d8f3dc',
      fontSize: 12,
      marginTop: 2,
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    notificationBtn: {
      marginRight: 4,
    },

    avatar: {
      backgroundColor:
        'white',
      height: 40,
      width: 40,
      borderRadius: 20,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    avatarText: {
      color: '#175812',
      fontWeight:
        'bold',
      fontSize: 16,
    },

    dropdown: {
      position:
        'absolute',
      top: 80,
      right: 18,
      backgroundColor:
        'white',
      width: 230,
      borderRadius: 22,
      padding: 16,
      elevation: 10,
      zIndex: 999,
    },

    profileTop: {
      alignItems:
        'center',
      marginBottom: 16,
    },

    profileCircle: {
      width: 65,
      height: 65,
      borderRadius: 40,
      backgroundColor:
        '#e8f5e9',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    profileCircleText: {
      color: '#175812',
      fontSize: 24,
      fontWeight:
        'bold',
    },

    profileName: {
      fontSize: 17,
      fontWeight:
        'bold',
      marginTop: 10,
    },

    profileRole: {
      color: '#666',
      marginTop: 4,
    },

    menuItem: {
      flexDirection:
        'row',
      alignItems:
        'center',
      paddingVertical: 12,
    },

    menuText: {
      marginLeft: 12,
      fontSize: 15,
      color: '#111',
    },

    logoutBtn: {
      backgroundColor:
        '#e53935',
      marginTop: 12,
      borderRadius: 16,
      height: 50,
      justifyContent:
        'center',
      alignItems:
        'center',
      flexDirection:
        'row',
    },

    logoutText: {
      color: 'white',
      marginLeft: 8,
      fontWeight:
        'bold',
    },

    welcomeCard: {
      backgroundColor:
        '#175812',
      margin: 18,
      borderRadius: 28,
      padding: 22,
      flexDirection:
        'row',
      alignItems:
        'center',
      elevation: 6,
    },

    welcomeTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight:
        'bold',
    },

    welcomeSubtitle: {
      color: '#d8f3dc',
      marginTop: 10,
      lineHeight: 22,
      width: '90%',
    },

    activeChip: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        'rgba(255,255,255,0.15)',
      alignSelf:
        'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
      marginTop: 16,
    },

    activeChipText: {
      color: 'white',
      marginLeft: 6,
      fontWeight:
        '600',
    },

    adminImage: {
      width: 85,
      height: 85,
      resizeMode:
        'contain',
    },

    analyticsRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      paddingHorizontal: 18,
      marginBottom: 16,
    },

    analyticsCard: {
      width: '48%',
      backgroundColor:
        'white',
      borderRadius: 24,
      paddingVertical: 24,
      alignItems:
        'center',
      elevation: 4,
    },

    analyticsValue: {
      fontSize: 24,
      fontWeight:
        'bold',
      marginTop: 10,
      color: '#111',
    },

    analyticsLabel: {
      color: '#666',
      marginTop: 4,
    },

    liveCard: {
      backgroundColor:
        'white',
      marginHorizontal: 18,
      borderRadius: 24,
      padding: 20,
      elevation: 4,
    },

    liveTop: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    liveTitle: {
      fontSize: 18,
      fontWeight:
        'bold',
      color: '#111',
    },

    liveSub: {
      color: '#666',
      marginTop: 4,
    },

    liveBadge: {
      backgroundColor:
        '#e53935',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
    },

    liveBadgeText: {
      color: 'white',
      fontWeight:
        'bold',
    },

    operationRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      marginTop: 22,
    },

    operationItem: {
      width: '48%',
      backgroundColor:
        '#f5f7fb',
      borderRadius: 18,
      padding: 16,
      alignItems:
        'center',
    },

    operationTitle: {
      marginTop: 10,
      color: '#666',
    },

    operationValue: {
      marginTop: 6,
      fontWeight:
        'bold',
      fontSize: 16,
      color: '#111',
    },

    sectionHeader: {
      marginHorizontal: 18,
      marginTop: 28,
      marginBottom: 14,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        'bold',
      color: '#111',
    },

    grid: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
      justifyContent:
        'space-between',
      paddingHorizontal: 18,
    },

    actionCard: {
      width: '48%',
      backgroundColor:
        'white',
      borderRadius: 24,
      paddingVertical: 24,
      alignItems:
        'center',
      marginBottom: 16,
      elevation: 4,
    },

    iconBox: {
      width: 65,
      height: 65,
      borderRadius: 20,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    actionTitle: {
      marginTop: 14,
      fontWeight:
        '700',
      fontSize: 15,
      color: '#111',
      textAlign:
        'center',
    },

    searchCard: {
      backgroundColor:
        'white',
      marginHorizontal: 18,
      marginTop: 10,
      borderRadius: 24,
      padding: 18,
      elevation: 4,
    },

    searchWrapper: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        '#f5f7fb',
      borderRadius: 16,
      paddingHorizontal: 14,
    },

    searchInput: {
      flex: 1,
      marginLeft: 6,
      color: '#111',
    },

    searchResult: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderColor:
        '#eee',
    },

    recentCard: {
      backgroundColor:
        'white',
      marginHorizontal: 18,
      borderRadius: 24,
      padding: 18,
      elevation: 4,
    },

    recentItem: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginBottom: 14,
    },

    recentText: {
      marginLeft: 10,
      color: '#333',
      fontWeight:
        '500',
    },

    noRecentText: {
      color: '#777',
      textAlign:
        'center',
    },
  });