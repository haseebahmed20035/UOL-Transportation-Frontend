import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import React, { useContext, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'
import DateTimePicker from '@react-native-community/datetimepicker'

const InputField = ({
  label,
  icon,
  value,
  setValue,
  theme,
  keyboardType = 'default',
}) => (
  <View style={styles.inputBox}>
    <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>

    <View
      style={[
        styles.inputRow,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.box,
        },
      ]}
    >
      <Icon name={icon} size={18} color={theme.colors.icon} />

      <TextInput
        style={[styles.input, { color: theme.colors.text }]}
        placeholder={label}
        placeholderTextColor='#999'
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
      />
    </View>
  </View>
)

const AddDriver = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [name, setName] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [phone, setPhone] = useState('')
  const [cnic, setCnic] = useState('')
  const [joiningDate, setJoiningDate] = useState('')
  const [email, setEmail] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false)

    if (selectedDate) {
      const year = selectedDate.getFullYear()
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
      const day = String(selectedDate.getDate()).padStart(2, '0')

      const formattedDate = `${year}-${month}-${day}`

      setJoiningDate(formattedDate)
    }
  }
  const handleSubmit = async () => {
    if (!name || !email || !fatherName || !phone || !cnic || !joiningDate) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`${BASE_URL}/add-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          father_name: fatherName,
          phone,
          cnic,
          joining_date: joiningDate,
        }),
      })

      const text = await res.text()

      console.log('STATUS:', res.status)
      console.log('RAW RESPONSE:', text)

      let data

      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Invalid JSON from server')
      }

      if (res.ok) {
        Alert.alert('Success', data.message)

        setName('')
        setFatherName('')
        setPhone('')
        setCnic('')
        setJoiningDate('')

        navigation.goBack()
      } else {
        Alert.alert('Error', data.message)
      }
    } catch (err) {
      console.log('FINAL ERROR:', err)
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='white' />
        </TouchableOpacity>

        <Text style={styles.headerText}>Add Driver</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* FORM */}
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.box,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Driver Details
          </Text>

          <InputField
            label='Driver Name'
            icon='person-outline'
            value={name}
            setValue={setName}
            theme={theme}
          />
          <InputField
            label='Email Address'
            icon='mail-outline'
            value={email}
            setValue={setEmail}
            theme={theme}
            keyboardType='email-address'
          />
          <InputField
            label="Father's Name"
            icon='people-outline'
            value={fatherName}
            setValue={setFatherName}
            theme={theme}
          />

          <InputField
            label='Phone Number'
            icon='call-outline'
            value={phone}
            setValue={setPhone}
            theme={theme}
            keyboardType='phone-pad'
          />

          <InputField
            label='CNIC Number'
            icon='card-outline'
            value={cnic}
            setValue={setCnic}
            theme={theme}
            keyboardType='numeric'
          />

          <View style={styles.inputBox}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Joining Date
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.inputRow,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.box,
                },
              ]}
            >
              <Icon
                name='calendar-outline'
                size={18}
                color={theme.colors.icon}
              />

              <Text
                style={[
                  styles.dateText,
                  {
                    color: joiningDate ? theme.colors.text : '#999',
                  },
                ]}
              >
                {joiningDate || 'Select Joining Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Adding...' : 'Add Driver'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode='date'
          display='default'
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  )
}

export default AddDriver

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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  content: {
    padding: 20,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    elevation: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },

  inputBox: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 6,
    fontWeight: '600',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  input: {
    flex: 1,
    padding: 10,
  },

  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateText: {
    flex: 1,
    padding: 10,
    fontSize: 14,
  },
})
