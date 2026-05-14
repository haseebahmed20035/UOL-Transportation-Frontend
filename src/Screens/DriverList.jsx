import React,
{
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import Icon
from 'react-native-vector-icons/Ionicons'

import {
  ThemeContext,
} from '../context/ThemeContext'

import {
  BASE_URL,
} from '../services/baseUrl'

const DriverList = ({
  navigation,
}) => {

  const { theme } =
    useContext(ThemeContext)

  const [drivers,
    setDrivers] =
      useState([])

  const [filteredDrivers,
    setFilteredDrivers] =
      useState([])

  const [loading,
    setLoading] =
      useState(true)

  const [refreshing,
    setRefreshing] =
      useState(false)

  const [search,
    setSearch] =
      useState('')

  const fetchDrivers =
    async () => {

      try {

        const res =
          await fetch(
            `${BASE_URL}/all-drivers`
          )

        const data =
          await res.json()

        setDrivers(data)
        setFilteredDrivers(data)

      } catch (err) {

        console.log(err)

      } finally {

        setLoading(false)
        setRefreshing(false)
      }
    }

  useEffect(() => {

    fetchDrivers()

  }, [])

  const onRefresh =
    async () => {

      setRefreshing(true)

      await fetchDrivers()
    }

  const handleSearch =
    text => {

      setSearch(text)

      const filtered =
        drivers.filter(
          item =>

            item.name
              ?.toLowerCase()
              .includes(
                text.toLowerCase()
              ) ||

            item.phone
              ?.includes(text) ||

            item.cnic
              ?.includes(text)
        )

      setFilteredDrivers(
        filtered
      )
    }

  const renderDriver =
    ({ item }) => (

      <View
        style={[
          styles.card,
          {
            backgroundColor:
              theme.colors.option,
          },
        ]}>

        {/* TOP */}
        <View style={styles.topRow}>

          <View
            style={
              styles.avatar
            }>

            <Text
              style={
                styles.avatarText
              }>

              {item.name
                ?.charAt(0)}

            </Text>

          </View>

          <View
            style={{
              flex: 1,
              marginLeft: 12,
            }}>

            <Text
              style={[
                styles.name,
                {
                  color:
                    theme.colors.text,
                },
              ]}>

              {item.name}

            </Text>

            <Text
              style={
                styles.email
              }>

              {item.email}

            </Text>

          </View>

          <View
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  item.is_available === 1
                    ? '#E8F5E9'
                    : '#FFEBEE',
              },
            ]}>

            <Text
              style={{
                color:
                  item.is_available === 1
                    ? '#2E7D32'
                    : '#D32F2F',

                fontWeight:
                  'bold',
              }}>

              {item.is_available === 1
                ? 'Available'
                : 'Assigned'}

            </Text>

          </View>

        </View>

        {/* INFO */}

        <View style={styles.infoRow}>

          <Icon
            name='call-outline'
            size={18}
            color='#666'
          />

          <Text
            style={styles.infoText}>

            {item.phone}

          </Text>

        </View>

        <View style={styles.infoRow}>

          <Icon
            name='card-outline'
            size={18}
            color='#666'
          />

          <Text
            style={styles.infoText}>

            {item.cnic}

          </Text>

        </View>

        <View style={styles.infoRow}>

          <Icon
            name='people-outline'
            size={18}
            color='#666'
          />

          <Text
            style={styles.infoText}>

            Father:
            {' '}
            {item.father_name}

          </Text>

        </View>

        <View style={styles.infoRow}>

          <Icon
            name='calendar-outline'
            size={18}
            color='#666'
          />

          <Text
            style={styles.infoText}>

            Joined:
            {' '}
            {
              item.joining_date
                ?.split('T')[0]
            }

          </Text>

        </View>

        {/* BUS INFO */}

        {item.is_available !== 1 && (

          <View
            style={
              styles.busCard
            }>

            <View
              style={
                styles.busTop
              }>

              <Icon
                name='bus'
                size={22}
                color='#175812'
              />

              <Text
                style={
                  styles.busTitle
                }>

                Assigned Bus

              </Text>

            </View>

            <Text
              style={
                styles.busInfo
              }>

              Bus Number:
              {' '}
              {
                item.bus_number
              }

            </Text>

            <Text
              style={
                styles.busInfo
              }>

              Route:
              {' '}
              {
                item.route_name
              }

            </Text>

          </View>
        )}

      </View>
    )

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            theme.colors.background,
        },
      ]}>

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme.colors.primary,
          },
        ]}>

        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }>

          <Icon
            name='arrow-back'
            size={24}
            color={
              theme.colors.background
            }
          />

        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            {
              color:
                theme.colors.background,
            },
          ]}>

          View Drivers

        </Text>

        <View
          style={{
            width: 24,
          }}
        />

      </View>

      {/* SEARCH */}

      <View
        style={[
          styles.searchBox,
          {
            backgroundColor:
              theme.colors.option,
          },
        ]}>

        <Icon
          name='search'
          size={20}
          color='gray'
        />

        <TextInput
          placeholder='Search driver...'
          placeholderTextColor='gray'
          value={search}
          onChangeText={
            handleSearch
          }
          style={[
            styles.searchInput,
            {
              color:
                theme.colors.text,
            },
          ]}
        />

      </View>

      {/* LIST */}

      {loading ? (

        <View
          style={
            styles.loader
          }>

          <ActivityIndicator
            size='large'
            color={
              theme.colors.primary
            }
          />

        </View>

      ) : (

        <FlatList
          data={
            filteredDrivers
          }
          keyExtractor={
            item =>
              item.id.toString()
          }
          renderItem={
            renderDriver
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 30,
          }}
          showsVerticalScrollIndicator={
            false
          }
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
          ListEmptyComponent={
            <Text
              style={{
                textAlign:
                  'center',
                marginTop: 50,
                color: 'gray',
              }}>

              No drivers found

            </Text>
          }
        />
      )}

    </View>
  )
}

export default DriverList

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
    },

    header: {
      flexDirection: 'row',
      paddingVertical: 16,
      paddingHorizontal: 18,
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
    },

    searchBox: {
      margin: 16,
      borderRadius: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 2,
    },

    searchInput: {
      flex: 1,
      padding: 12,
      fontSize: 14,
    },

    loader: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    card: {
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      elevation: 3,
    },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },

    avatar: {
      width: 55,
      height: 55,
      borderRadius: 30,
      backgroundColor:
        '#175812',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    avatarText: {
      color: 'white',
      fontWeight:
        'bold',
      fontSize: 20,
    },

    name: {
      fontSize: 17,
      fontWeight:
        'bold',
    },

    email: {
      color: 'gray',
      marginTop: 4,
      fontSize: 13,
    },

    statusChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 100,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    infoText: {
      marginLeft: 10,
      color: '#444',
      fontSize: 14,
    },

    busCard: {
      backgroundColor:
        '#F5F7FB',
      marginTop: 12,
      borderRadius: 16,
      padding: 14,
    },

    busTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    busTitle: {
      marginLeft: 8,
      fontWeight:
        'bold',
      fontSize: 15,
      color: '#175812',
    },

    busInfo: {
      color: '#444',
      marginBottom: 6,
    },
  })