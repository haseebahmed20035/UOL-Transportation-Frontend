import React, { useContext, useEffect, useMemo, useState } from 'react'
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
  RefreshControl,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'
import DateTimePicker from '@react-native-community/datetimepicker'

const SendVoucher = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()

  const [title, setTitle] = useState('Transport Fee Voucher')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [message, setMessage] = useState('')

  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [sendToAll, setSendToAll] = useState(true)
  const [search, setSearch] = useState('')

  const [loadingStudents, setLoadingStudents] = useState(false)
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [showDueDatePicker, setShowDueDatePicker] = useState(false)
  const [dueDateValue, setDueDateValue] = useState(new Date())

  const formatDateForApi = date => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const onDueDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDueDatePicker(false)
    }

    if (event?.type === 'dismissed') return

    if (selectedDate) {
      setDueDateValue(new Date())
      setDueDate(formatDateForApi(selectedDate))
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const res = await axios.get(`${BASE_URL}/fee/students`)

      if (res.data?.success) {
        setStudents(res.data.students || [])
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to load students')
      }
    } catch (error) {
      console.log(
        'Fetch students error:',
        error.response?.data || error.message,
      )
      Alert.alert('Error', 'Unable to fetch students')
    } finally {
      setLoadingStudents(false)
      setRefreshing(false)
    }
  }

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return students

    return students.filter(item => {
      const name = String(item.name || '').toLowerCase()
      const email = String(item.email || '').toLowerCase()
      const regNo = String(item.reg_no || '').toLowerCase()
      const department = String(item.department || '').toLowerCase()

      return (
        name.includes(q) ||
        email.includes(q) ||
        regNo.includes(q) ||
        department.includes(q)
      )
    })
  }, [students, search])

  const selectedCount = sendToAll ? students.length : selectedStudents.length

  const toggleStudent = studentId => {
    setSelectedStudents(prev => {
      const exists = prev.includes(studentId)

      if (exists) {
        return prev.filter(id => id !== studentId)
      }

      return [...prev, studentId]
    })
  }

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter voucher title')
      return false
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Alert.alert('Required', 'Please enter valid fee amount')
      return false
    }

    if (!dueDate.trim()) {
      Alert.alert('Required', 'Please enter due date')
      return false
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dueDate.trim())) {
      Alert.alert('Invalid Date', 'Please enter due date in YYYY-MM-DD format')
      return false
    }

    if (!sendToAll && selectedStudents.length === 0) {
      Alert.alert('Required', 'Please select at least one student')
      return false
    }

    return true
  }

  const sendVoucher = async () => {
    if (!validateForm()) return

    Alert.alert(
      'Send Fee Voucher',
      `This voucher will be sent to ${selectedCount} student(s). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setSending(true)

              const storedUser = await AsyncStorage.getItem('user')
              const user = storedUser ? JSON.parse(storedUser) : null

              const payload = {
                title: title.trim(),
                amount: Number(amount),
                due_date: dueDate.trim(),
                message: message.trim(),
                send_to_all: sendToAll,
                student_ids: sendToAll ? [] : selectedStudents,
                created_by: user?.id || user?.user_id || null,
              }

              const res = await axios.post(
                `${BASE_URL}/fee/send-vouchers`,
                payload,
              )

              if (res.data?.success) {
                Alert.alert(
                  'Success',
                  res.data.message || 'Fee voucher sent successfully',
                )

                setTitle('Transport Fee Voucher')
                setAmount('')
                setDueDate('')
                setMessage('')
                setSendToAll(true)
                setSelectedStudents([])
                setSearch('')
              } else {
                Alert.alert(
                  'Error',
                  res.data?.message || 'Failed to send voucher',
                )
              }
            } catch (error) {
              console.log(
                'Send voucher error:',
                error.response?.data || error.message,
              )
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Unable to send fee voucher',
              )
            } finally {
              setSending(false)
            }
          },
        },
      ],
    )
  }

  const sendReminders = async () => {
    try {
      setReminderLoading(true)
      const res = await axios.post(`${BASE_URL}/fee/send-reminders`)

      if (res.data?.success) {
        Alert.alert(
          'Success',
          res.data.message || 'Reminders sent successfully',
        )
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to send reminders')
      }
    } catch (error) {
      console.log('Reminder error:', error.response?.data || error.message)
      Alert.alert('Error', 'Unable to send reminders')
    } finally {
      setReminderLoading(false)
    }
  }

  const renderStudent = item => {
    const selected = selectedStudents.includes(item.student_id)

    return (
      <TouchableOpacity
        key={item.student_id}
        activeOpacity={0.85}
        onPress={() => toggleStudent(item.student_id)}
        disabled={sendToAll}
        style={[
          styles.studentCard,
          {
            backgroundColor: sendToAll
              ? theme.colors.option
              : selected
              ? theme.colors.option
              : theme.colors.dashboard,
            borderColor:
              selected || sendToAll
                ? theme.colors.primary
                : theme.colors.border,
            opacity: sendToAll ? 0.7 : 1,
          },
        ]}
      >
        <View
          style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.avatarText, { color: theme.colors.headerText }]}>
            {String(item.name || 'S')
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.studentName, { color: theme.colors.text }]}>
            {item.name || 'Student'}
          </Text>

          <Text style={[styles.studentInfo, { color: theme.colors.icon }]}>
            {item.reg_no || 'No Reg No'} • {item.department || 'Department'}
          </Text>

          <Text style={[styles.studentEmail, { color: theme.colors.icon }]}>
            {item.email || 'No email'}
          </Text>
        </View>

        <Icon
          name={selected || sendToAll ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={
            selected || sendToAll ? theme.colors.primary : theme.colors.icon
          }
        />
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.primary,
              paddingTop: insets.top + 12,
            },
          ]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name='arrow-back' size={26} color={theme.colors.headerText} />
          </TouchableOpacity>

          <Text style={[styles.headerText, { color: theme.colors.headerText }]}>
            Send Fees
          </Text>

          <TouchableOpacity onPress={sendReminders} disabled={reminderLoading}>
            {reminderLoading ? (
              <ActivityIndicator size='small' color={theme.colors.headerText} />
            ) : (
              <Icon
                name='mail-outline'
                size={24}
                color={theme.colors.headerText}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps='handled'
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchStudents()
              }}
            />
          }
        >
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.colors.dashboard,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.summaryIconBox}>
              <Icon
                name='receipt-outline'
                size={30}
                color={theme.colors.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                Create Transport Fee Voucher
              </Text>
              <Text style={[styles.summarySub, { color: theme.colors.icon }]}>
                Send fee vouchers to students and track paid/unpaid status.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.dashboard,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Voucher Details
            </Text>

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder='Transport Fee Voucher'
              placeholderTextColor={theme.colors.icon}
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Amount
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder='Enter amount e.g. 5000'
              placeholderTextColor={theme.colors.icon}
              keyboardType='numeric'
              style={[
                styles.input,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Due Date
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowDueDatePicker(true)}
              style={[
                styles.dateInput,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.dateText,
                  {
                    color: dueDate ? theme.colors.text : theme.colors.icon,
                  },
                ]}
              >
                {dueDate || 'Select due date'}
              </Text>

              <Icon
                name='calendar-outline'
                size={21}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            {showDueDatePicker && (
              <View>
                <DateTimePicker
                  value={dueDateValue}
                  mode='date'
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  minimumDate={new Date()}
                  onChange={onDueDateChange}
                />

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setShowDueDatePicker(false)}
                    style={[
                      styles.iosDoneBtn,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.iosDoneText,
                        { color: theme.colors.headerText },
                      ]}
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={[styles.label, { color: theme.colors.text }]}>
              Message Optional
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder='Write note for students...'
              placeholderTextColor={theme.colors.icon}
              multiline
              style={[
                styles.messageInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.dashboard,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <View>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.text }]}
                >
                  Students
                </Text>
                <Text style={[styles.smallText, { color: theme.colors.icon }]}>
                  Selected: {selectedCount}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setSendToAll(prev => !prev)
                  setSelectedStudents([])
                }}
                style={[
                  styles.allBtn,
                  {
                    backgroundColor: sendToAll
                      ? theme.colors.primary
                      : theme.colors.background,
                    borderColor: theme.colors.primary,
                  },
                ]}
              >
                <Icon
                  name={sendToAll ? 'checkmark-circle' : 'people-outline'}
                  size={17}
                  color={
                    sendToAll ? theme.colors.headerText : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.allBtnText,
                    {
                      color: sendToAll
                        ? theme.colors.headerText
                        : theme.colors.primary,
                    },
                  ]}
                >
                  All Students
                </Text>
              </TouchableOpacity>
            </View>

            {!sendToAll && (
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon
                  name='search-outline'
                  size={20}
                  color={theme.colors.icon}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder='Search student...'
                  placeholderTextColor={theme.colors.icon}
                  style={[styles.searchInput, { color: theme.colors.text }]}
                />
              </View>
            )}

            {loadingStudents ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size='large' color={theme.colors.primary} />
                <Text style={[styles.smallText, { color: theme.colors.icon }]}>
                  Loading students...
                </Text>
              </View>
            ) : filteredStudents.length === 0 ? (
              <View style={styles.emptyBox}>
                <Icon
                  name='people-outline'
                  size={42}
                  color={theme.colors.icon}
                />
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  No students found
                </Text>
              </View>
            ) : (
              filteredStudents.map(renderStudent)
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={sendVoucher}
            disabled={sending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: theme.colors.primary,
                opacity: sending ? 0.7 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator color={theme.colors.headerText} />
            ) : (
              <>
                <Icon
                  name='send-outline'
                  size={21}
                  color={theme.colors.headerText}
                />
                <Text
                  style={[
                    styles.sendBtnText,
                    { color: theme.colors.headerText },
                  ]}
                >
                  Send Fee Voucher
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default SendVoucher

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontSize: 18,
    fontWeight: '800',
  },

  scrollContent: {
    padding: 16,
  },

  summaryCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },

  summaryIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23,88,18,0.10)',
    marginRight: 12,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  summarySub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },

  formCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14,
  },

  messageInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 92,
    textAlignVertical: 'top',
  },

  cycleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  cycleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },

  cycleText: {
    fontSize: 12,
    fontWeight: '700',
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  smallText: {
    fontSize: 12,
    marginTop: 4,
  },

  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 6,
  },

  allBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 12,
    marginTop: 14,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
  },

  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '900',
  },

  studentName: {
    fontSize: 14,
    fontWeight: '800',
  },

  studentInfo: {
    fontSize: 11,
    marginTop: 3,
  },

  studentEmail: {
    fontSize: 11,
    marginTop: 2,
  },

  loaderBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
  },

  sendBtn: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },

  sendBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },

  iosDoneBtn: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },

  iosDoneText: {
    fontSize: 13,
    fontWeight: '900',
  },
})
