import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { BASE_URL, endPoints } from '../services/baseUrl'
import { registerDeviceToken } from '../utils/registerDeviceToken'

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef(null)

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
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password')
      return
    }

    try {
      setLoading(true)

      console.time('LOGIN_TOTAL')
      console.time('LOGIN_API')

      const response = await fetch(
        `${endPoints.loginBaseUrl}/${endPoints.login}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: username.trim(),
            password: password.trim(),
          }),
        },
      )

      console.timeEnd('LOGIN_API')

      const data = await response.json()

      console.log('LOGIN RESPONSE:', JSON.stringify(data, null, 2))

      if (!response.ok || !data.success) {
        Alert.alert(
          'Login Failed',
          getAlertMessage(data.message, 'Invalid credentials'),
        )
        return
      }

      const user = data.user
      const role = user?.role

      console.time('ASYNC_STORAGE')

      const storageItems = [
        ['user', JSON.stringify(user)],
        ['savedEmail', username.trim()],
        ['savedPassword', password.trim()],
      ]

      if (user?.student_id) {
        storageItems.push(['studentId', user.student_id.toString()])
      }

      await AsyncStorage.multiSet(storageItems)

      console.timeEnd('ASYNC_STORAGE')

      // ✅ Stop loader before navigation, so UI feels fast
      setLoading(false)

      // ✅ Navigate immediately after successful login
      if (role === 'admin') {
        navigation.replace('AdminDashboard')
      } else if (role === 'student') {
        navigation.replace('Tabs')
      } else if (role === 'driver') {
        navigation.replace('DriverDashboard')
      } else {
        Alert.alert('Error', 'Unknown role')
        return
      }

      console.timeEnd('LOGIN_TOTAL')

      // ✅ Run push token registration in background
      if (role === 'student') {
        const userId = user?.user_id || user?.userId || user?.id

        registerDeviceToken({
          role: 'student',
          userId,
        }).catch(error => {
          console.log('Student push token registration failed:', error)
        })
      }

      if (role === 'driver') {
        const driverId = user?.driver_id || user?.driverId || user?.id

        registerDeviceToken({
          role: 'driver',
          driverId,
        }).catch(error => {
          console.log('Driver push token registration failed:', error)
        })
      }
    } catch (error) {
      console.log('LOGIN ERROR:', error)

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {/* TOP GREEN AREA */}
        <View style={styles.topContainer}>
          <Image source={require('../Images/logo.png')} style={styles.logo} />

          <Text style={styles.mainHeading}>UOL Transportation</Text>

          <Text style={styles.subTitle}>Smart Campus Transport System</Text>
        </View>

        {/* LOGIN CARD */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>Welcome Back 👋</Text>

          <Text style={styles.loginText}>Login to continue your journey</Text>

          {/* EMAIL */}
          <View style={styles.inputContainer}>
            <TextInput
              placeholder='University Email'
              placeholderTextColor='#888'
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='next'
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              placeholder='Password'
              placeholderTextColor='#888'
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              returnKeyType='done'
              onSubmitEditing={handleAdminLogin}
            />
          </View>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.8 }]}
            onPress={handleAdminLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color='white' />
            ) : (
              <Text style={styles.loginBtnText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },

  topContainer: {
    backgroundColor: '#0f5c12',
    height: 360,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  logo: {
    width: 200,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 10,
  },

  mainHeading: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  subTitle: {
    color: '#d8f3dc',
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 22,
    marginTop: -55,
    borderRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },

  loginText: {
    color: '#666',
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
  },

  inputContainer: {
    backgroundColor: '#f4f7fb',
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    height: 58,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e6ebf2',
  },

  input: {
    color: '#111',
    fontSize: 16,
  },

  loginBtn: {
    backgroundColor: '#0f5c12',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
  },

  loginBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
})
