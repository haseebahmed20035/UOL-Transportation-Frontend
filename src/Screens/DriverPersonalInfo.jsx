import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native'

import React, {
  useContext,
  useEffect,
  useState,
} from 'react'

import AsyncStorage
from '@react-native-async-storage/async-storage'

import Icon
from 'react-native-vector-icons/Ionicons'

import {
  ThemeContext,
} from '../context/ThemeContext'

import {
  BASE_URL,
  endPoints,
} from '../services/baseUrl'

const DriverPersonalInfo = ({
  navigation,
}) => {

  const { theme } =
    useContext(ThemeContext)

  const [driver,
    setDriver] =
      useState(null)

  const fetchDriver =
    async () => {

      try {

        const userData =
          await AsyncStorage.getItem(
            'user'
          )

        const user =
          JSON.parse(userData)

        const res =
          await fetch(
            `${BASE_URL}/${endPoints.driver}/${user.user_id}`
          )

        const data =
          await res.json()

        setDriver(data)

      } catch (err) {

        console.log(
          'ERROR:',
          err
        )
      }
    }

  useEffect(() => {

    fetchDriver()

  }, [])

  const InfoRow = ({
    label,
    value,
  }) => (

    <View style={styles.infoBlock}>

      <Text
        style={[
          styles.label,
          {
            color:
              theme.colors.text,
          },
        ]}>

        {label}

      </Text>

      <Text
        style={[
          styles.value,
          {
            color:
              theme.colors.text,
          },
        ]}>

        {value}

      </Text>

      <View
        style={[
          styles.divider,
          {
            backgroundColor:
              theme.colors.border,
          },
        ]}
      />

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
            size={26}
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

          Driver Information

        </Text>

        <View
          style={{
            width: 26,
          }}
        />

      </View>

      {/* BODY */}
      <ScrollView
        contentContainerStyle={
          styles.wrapper
        }>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                theme.colors.option,
            },
          ]}>

          <InfoRow
            label='Driver Name'
            value={
              driver?.name ||
              'Loading...'
            }
          />

          <InfoRow
            label='Email Address'
            value={
              driver?.email ||
              'Loading...'
            }
          />

          <InfoRow
            label="Father's Name"
            value={
              driver?.father_name ||
              'Loading...'
            }
          />

          <InfoRow
            label='Phone Number'
            value={
              driver?.phone ||
              'Loading...'
            }
          />

          <InfoRow
            label='CNIC Number'
            value={
              driver?.cnic ||
              'Loading...'
            }
          />

          <InfoRow
            label='Joining Date'
            value={
              driver?.joining_date
                ?.split('T')[0] ||
              'Loading...'
            }
          />

          <InfoRow
            label='Availability'
            value={
              driver?.is_available === 1
                ? 'Available'
                : 'Assigned'
            }
          />

        </View>

        <TouchableOpacity
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor:
              theme.colors.primary,
            borderRadius: 10,
            alignItems:
              'center',
          }}
          onPress={() =>
            navigation.navigate(
              'ChangePassword'
            )
          }>

          <Text
            style={{
              color: '#fff',
              fontWeight: 'bold',
            }}>

            Change Password

          </Text>

        </TouchableOpacity>

      </ScrollView>

    </View>
  )
}

export default DriverPersonalInfo

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent:
      'space-between',
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
})