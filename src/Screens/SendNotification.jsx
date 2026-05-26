import React, { useContext, useState } from 'react'
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL, endPoints } from '../services/baseUrl'

const SendNotification = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState('all')
  const [isSending, setIsSending] = useState(false)

  const targetOptions = [
    {
      label: 'All Users',
      value: 'all',
      icon: 'people-outline',
      description: 'Send to students and drivers',
    },
    {
      label: 'Students Only',
      value: 'student',
      icon: 'school-outline',
      description: 'Send only to students',
    },
    {
      label: 'Drivers Only',
      value: 'driver',
      icon: 'bus-outline',
      description: 'Send only to drivers',
    },
  ]

  const sendNotification = async () => {
    const trimmedTitle = title.trim()
    const trimmedMessage = message.trim()

    if (!trimmedTitle) {
      Alert.alert('Missing Title', 'Please enter notification title.')
      return
    }

    if (!trimmedMessage) {
      Alert.alert('Missing Message', 'Please enter notification message.')
      return
    }

    try {
      setIsSending(true)

      const storedUser = await AsyncStorage.getItem('user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null

      const adminId =
        parsedUser?.id ||
        parsedUser?.user_id ||
        parsedUser?.userId ||
        null

      const response = await axios.post(
        `${BASE_URL}/${endPoints.sendAdminNotification}`,
        {
          title: trimmedTitle,
          message: trimmedMessage,
          target_role: targetRole,
          created_by: adminId,
        }
      )

      if (response.data?.success) {
        Alert.alert('Success', 'Notification sent successfully.')

        setTitle('')
        setMessage('')
        setTargetRole('all')
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to send notification.'
        )
      }
    } catch (error) {
      console.log('Send notification error:', error?.response?.data || error)

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Something went wrong while sending notification.'
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.headerText} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.headerText }]}>
          Notification
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={[styles.sectionTitle, {color:theme.colors.text}]}>Select Audience</Text>

          <View style={styles.optionWrapper}>
            {targetOptions.map(item => {
              const isSelected = targetRole === item.value

              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.8}
                  onPress={() => setTargetRole(item.value)}
                  style={[
                    styles.targetCard,
                    isSelected && {
                      borderColor: theme.colors.primary,
                      backgroundColor: '#F0F8F0',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.targetIconBox,
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={22}
                      color={isSelected ? '#fff' : theme.colors.icon}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.targetLabel}>{item.label}</Text>
                    <Text style={styles.targetDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <Icon
                    name={
                      isSelected
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={24}
                    color={isSelected ? theme.colors.primary : '#B6B6B6'}
                  />
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, {color:theme.colors.text}]}>Notification Details</Text>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Title</Text>

            <View style={styles.inputBox}>
              <Icon name='create-outline' size={20} color='#777' />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder='Example: Route Update'
                placeholderTextColor='#999'
                style={styles.input}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Message</Text>

            <View style={[styles.inputBox, styles.messageBox]}>
              <Icon
                name='chatbox-ellipses-outline'
                size={20}
                color='#777'
                style={{ marginTop: 3 }}
              />
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder='Write notification message here...'
                placeholderTextColor='#999'
                style={[styles.input, styles.messageInput]}
                multiline
                textAlignVertical='top'
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={sendNotification}
            disabled={isSending}
            style={[
              styles.sendButton,
              {
                backgroundColor: isSending
                  ? '#9CB89A'
                  : theme.colors.primary,
              },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size='small' color='#fff' />
            ) : (
              <>
                <Icon name='send-outline' size={20} color='#fff' />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

export default SendNotification

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222',
    marginBottom: 12,
  },

  optionWrapper: {
    marginBottom: 22,
  },

  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.3,
    borderColor: '#EFEFEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  targetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  targetLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  targetDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 50,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#222',
  },

  messageBox: {
    height: 125,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  messageInput: {
    minHeight: 105,
    paddingTop: 0,
  },

  sendButton: {
    height: 54,
    borderRadius: 16,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 3,
  },

  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
})