import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import React, { useState, useEffect } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'http://192.168.100.100:5000/api' // 🔥 your IP

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const loadSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('savedEmail')
      const savedPassword = await AsyncStorage.getItem('savedPassword')

      if (savedEmail) setUsername(savedEmail)
      if (savedPassword) setPassword(savedPassword)
    } catch (err) {
      console.log('LOAD ERROR:', err)
    }
  }
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '967891107317-2nje8fbbcq60u2l5bpq668brt1qrapol.apps.googleusercontent.com',
    })

    loadSavedCredentials()
  }, [])
  const getAlertMessage = (value, fallback = 'Something went wrong') => {
    if (typeof value === 'string') return value

    if (Array.isArray(value)) {
      return value
        .map(item => {
          if (typeof item === 'string') return item
          return JSON.stringify(item)
        })
        .join('\n')
    }

    if (value && typeof value === 'object') {
      if (typeof value.message === 'string') return value.message
      if (typeof value.error === 'string') return value.error
      if (typeof value.msg === 'string') return value.msg

      return JSON.stringify(value, null, 2)
    }

    return fallback
  }
  // ================= ADMIN LOGIN =================
  const handleAdminLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter username and password')
      return
    }

    try {
      setLoading(true)
      await AsyncStorage.setItem('savedEmail', username)
      await AsyncStorage.setItem('savedPassword', password)
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username.trim(),
          password: password.trim(),
        }),
      })

      const data = await response.json()

      console.log('ADMIN LOGIN RESPONSE:', JSON.stringify(data, null, 2))

      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user))

        if (data.user?.student_id) {
          await AsyncStorage.setItem(
            'studentId',
            data.user.student_id.toString(),
          )
        }
        await AsyncStorage.setItem('user', JSON.stringify(data.user))
        await AsyncStorage.setItem('savedEmail', username)
        await AsyncStorage.setItem('savedPassword', password)
        const role = data.user?.role

        if (role === 'admin') {
          navigation.replace('AdminDashboard')
        } else if (role === 'student') {
          navigation.replace('Tabs')
        } else if (role === 'driver') {
          navigation.replace('DriverDashboard')
        } else {
          Alert.alert('Error', 'Unknown role')
        }
      } else {
        Alert.alert(
          'Login Failed',
          getAlertMessage(data.message, 'Invalid credentials'),
        )
      }
    } catch (error) {
      console.log('ADMIN ERROR:', error)

      Alert.alert(
        'Error',
        getAlertMessage(error?.message || error, 'Something went wrong'),
      )
    } finally {
      setLoading(false)
    }
  }

  // ================= UI =================
  return (
    <View style={{ padding: 27 }}>
      <View style={styles.Body}>
        <Image
          source={require('../Images/logo.png')}
          style={{ width: 200, resizeMode: 'contain', alignSelf: 'center' }}
        />

        <Text style={styles.mainHeading}>UOL Transportation App</Text>
        <Text style={styles.subHeading}>
          Enter admin details OR use Google login
        </Text>

        {/* ADMIN LOGIN */}
        <View style={{ gap: 12, paddingHorizontal: 10 }}>
          <View style={styles.textBox}>
            <TextInput
              placeholder='Email'
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.textBox}>
            <TextInput
              placeholder='Password'
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ color: 'black' }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.LoginBtn} onPress={handleAdminLogin}>
          {loading ? (
            <ActivityIndicator color='white' />
          ) : (
            <Text style={styles.LoginBtnText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  mainHeading: {
    color: '#113d1ece',
    textAlign: 'center',
    fontSize: 25,
    fontWeight: 'bold',
  },
  Body: {
    backgroundColor: 'white',
    elevation: 2,
    minHeight: 700,
    padding: 10,
    borderRadius: 10,
  },
  subHeading: {
    textAlign: 'center',
    marginTop: 15,
    color: '#113d1eef',
    marginBottom: 40,
  },
  textBox: {
    borderWidth: 1,
    borderColor: 'lightgray',
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 2,
    paddingHorizontal: 10,
  },
  LoginBtn: {
    marginTop: 20,
    backgroundColor: '#113d1eef',
    width: '90%',
    alignSelf: 'center',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
  },
  LoginBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
})
