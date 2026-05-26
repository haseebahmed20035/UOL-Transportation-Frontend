import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL, endPoints } from '../services/baseUrl'

const AllStudents = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const [students, setStudents] = useState([])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/all-students`,
      )
      const data = await res.json()

      setStudents(data)
    } catch (err) {
      console.log(err)
    }
  }

  const StudentCard = ({ item }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.option },
      ]}
    >
      <View style={styles.row}>
        <Icon name="person-circle-outline" size={40} color={theme.colors.primary} />

        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.email, { color: '#777' }]}>
            {item.email}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Reg No:</Text>
        <Text style={styles.value}>{item.reg_no}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Dept:</Text>
        <Text style={styles.value}>{item.department}</Text>
      </View>
    </View>
  )

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>All Students</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        {students.map((item, index) => (
          <StudentCard key={index} item={item} />
        ))}
      </ScrollView>
    </View>
  )
}

export default AllStudents

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
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  email: {
    fontSize: 13,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  label: {
    fontWeight: 'bold',
  },

  value: {
    color: '#555',
  },
})