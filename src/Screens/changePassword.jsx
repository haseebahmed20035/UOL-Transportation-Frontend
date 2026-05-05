import React, { useState, useContext } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'

const ChangePassword = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [otp, setOtp] = useState('')
  const [newPass, setNewPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  const sendOtp = async () => {
    const user = JSON.parse(await AsyncStorage.getItem('user'))

    await fetch('http://192.168.100.100:5000/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    })

    Alert.alert('OTP sent to email')
  }

  const changePassword = async () => {
    if (!newPass) {
      Alert.alert('Error', 'Please enter new password')
      return
    }

    if (newPass.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    if (!otp) {
      Alert.alert('Error', 'Please enter OTP')
      return
    }

    const user = JSON.parse(await AsyncStorage.getItem('user'))

    const res = await fetch('http://192.168.100.100:5000/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        otp,
        newPassword: newPass,
      }),
    })

    const data = await res.json()

    Alert.alert(data.message)
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.icon }]}>
          Change Password
        </Text>

        <View style={{ width: 24 }} />
      </View>

      {/* CARD */}
      <View style={styles.wrapper}>
        <View style={[styles.card, { backgroundColor: theme.colors.option }]}>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Secure Your Account 🔐
          </Text>

          {/* OTP */}
          <View style={[styles.inputBox, { borderColor: theme.colors.border }]}>
            <Icon name="key-outline" size={18} color={theme.colors.icon} />
            <TextInput
              placeholder="Enter OTP"
              placeholderTextColor="#999"
              value={otp}
              onChangeText={setOtp}
              style={[styles.input, { color: theme.colors.text }]}
              keyboardType="numeric"
            />
          </View>

          {/* PASSWORD */}
          <View style={[styles.inputBox, { borderColor: theme.colors.border }]}>
            <Icon name="lock-closed-outline" size={18} color={theme.colors.icon} />
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPass}
              value={newPass}
              onChangeText={setNewPass}
              style={[styles.input, { color: theme.colors.text }]}
            />

            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Icon
                name={showPass ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
          </View>

          {/* SEND OTP */}
          <TouchableOpacity
            style={[styles.otpBtn, { backgroundColor: '#4285F4' }]}
            onPress={sendOtp}
          >
            <Text style={styles.otpText}>Send OTP</Text>
          </TouchableOpacity>

          {/* UPDATE */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={changePassword}
          >
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  )
}

export default ChangePassword

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderRadius: 16,
    elevation: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    padding: 10,
  },

  otpBtn: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  otpText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
})