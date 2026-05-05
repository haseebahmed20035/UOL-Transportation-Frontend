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

const InputField = ({ label, icon, value, setValue, theme }) => (
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
      />
    </View>
  </View>
)

const AddStudents = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [regNo, setRegNo] = useState('')
  const [department, setDepartment] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!name || !email || !regNo) {
      Alert.alert('Error', 'Please fill all required fields')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Enter valid email')
      return
    }

    try {
      setLoading(true)

      const res = await fetch('http://192.168.100.100:5000/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          reg_no: regNo,
          department,
        }),
      })

      const text = await res.text() // 👈 IMPORTANT
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

        <Text style={styles.headerText}>Add Student</Text>

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
            Student Details
          </Text>

          <InputField
            label='Full Name'
            icon='person-outline'
            value={name}
            setValue={setName}
            theme={theme}
          />

          <InputField
            label='Email'
            icon='mail-outline'
            value={email}
            setValue={setEmail}
            theme={theme}
          />

          <InputField
            label='Registration No'
            icon='card-outline'
            value={regNo}
            setValue={setRegNo}
            theme={theme}
          />

          <InputField
            label='Department'
            icon='school-outline'
            value={department}
            setValue={setDepartment}
            theme={theme}
          />

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Adding...' : 'Add Student'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AddStudents

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
})
