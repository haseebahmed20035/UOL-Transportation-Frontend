import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons'
import { ThemeContext } from '../context/ThemeContext'

const StudentsReq = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchStudentRequests()
  }, [])
  const approveRequest = async item => {
  try {
    const response = await fetch(
      `http://192.168.100.100:5000/approve-request/${item.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_id: item.route_id,
        }),
      },
    )

    const json = await response.json()

    Alert.alert('Success', json.message)

    fetchStudentRequests()
  } catch (e) {
    console.log(e)

    Alert.alert('Error', 'Approval failed')
  }
}
const rejectRequest = async item => {
  try {
    const response = await fetch(
      `http://192.168.100.100:5000/reject-request/${item.id}`,
      {
        method: 'PUT',
      },
    )

    const json = await response.json()

    Alert.alert('Success', json.message)

    fetchStudentRequests()
  } catch (e) {
    console.log(e)

    Alert.alert('Error', 'Reject failed')
  }
}
  const fetchStudentRequests = async () => {
    try {
      const response = await fetch(
        'http://192.168.100.100:5000/student-requests',
      )

      const json = await response.json()

      console.log('API RESPONSE:', json)

      if (Array.isArray(json)) {
        setRequests(json)
      } else {
        setRequests([])
        Alert.alert('Error', json.message || 'Invalid response')
      }
    } catch (e) {
      console.log(e)

      setRequests([])

      Alert.alert('Error', 'Failed to load requests')
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loaderContainer,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size='large' color={theme.colors.primary} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color='white' />
        </TouchableOpacity>

        <Text style={styles.headerText}>Students Requests</Text>

        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon
              name='document-text-outline'
              size={80}
              color={theme.colors.subtext}
            />

            <Text
              style={[
                styles.emptyText,
                {
                  color: theme.colors.subtext,
                },
              ]}
            >
              No Requests Found
            </Text>
          </View>
        ) : (
          Array.isArray(requests) &&
          requests.map((item, index) => (
            <View
              key={index}
              style={[
                styles.requestCard,
                {
                  backgroundColor: theme.colors.box,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {/* TOP SECTION */}
              <View style={styles.topRow}>
                <View style={styles.profileSection}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: theme.colors.primary + '20',
                      },
                    ]}
                  >
                    <Icon
                      name='person'
                      size={32}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.studentName,
                        {
                          color: theme.colors.text,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={[
                        styles.regNo,
                        {
                          color: theme.colors.subtext,
                        },
                      ]}
                    >
                      {item.reg_no}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === 'pending' ? '#FFA50020' : '#00C85320',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status === 'pending' ? '#FFA500' : '#00C853',
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* STUDENT DETAILS */}
              <View style={styles.infoSection}>
                <InfoRow
                  icon='mail-outline'
                  label='Email'
                  value={item.email}
                  theme={theme}
                />

                <InfoRow
                  icon='school-outline'
                  label='Department'
                  value={item.department}
                  theme={theme}
                />

                <InfoRow
                  icon='bus-outline'
                  label='Requested Route'
                  value={item.route_name}
                  theme={theme}
                />

                <InfoRow
                  icon='navigate-outline'
                  label='Source'
                  value={item.source}
                  theme={theme}
                />

                <InfoRow
                  icon='location-outline'
                  label='Destination'
                  value={item.destination}
                  theme={theme}
                />

                <InfoRow
                  icon='time-outline'
                  label='Estimated Time'
                  value={item.estimated_time}
                  theme={theme}
                />

                <InfoRow
                  icon='calendar-outline'
                  label='Request Time'
                  value={item.request_time}
                  theme={theme}
                />
              </View>

              {/* ROUTE STOPS */}
              <View style={styles.stopsSection}>
                <Text
                  style={[
                    styles.stopTitle,
                    {
                      color: theme.colors.text,
                    },
                  ]}
                >
                  Route Stops
                </Text>

                <View style={styles.stopWrap}>
                  {item.stops?.map((stop, i) => (
                    <View
                      key={i}
                      style={[
                        styles.stopChip,
                        {
                          backgroundColor: theme.colors.option,
                        },
                      ]}
                    >
                      <Icon
                        name='location'
                        size={12}
                        color={theme.colors.primary}
                      />

                      <Text
                        style={[
                          styles.stopText,
                          {
                            color: theme.colors.text,
                          },
                        ]}
                      >
                        {stop.stop_name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ACTIONS */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: '#00C853',
                    },
                  ]}
                onPress={() => approveRequest(item)}
                >
                  <Icon name='checkmark' size={18} color='white' />

                  <Text style={styles.actionText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: '#FF3B30',
                    },
                  ]}
                onPress={() => rejectRequest(item)}
                >
                  <Icon name='close' size={18} color='white' />

                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const InfoRow = ({ icon, label, value, theme }) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Icon name={icon} size={18} color={theme.colors.primary} />

        <Text
          style={[
            styles.infoLabel,
            {
              color: theme.colors.subtext,
            },
          ]}
        >
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.infoValue,
          {
            color: theme.colors.text,
          },
        ]}
      >
        {value || 'N/A'}
      </Text>
    </View>
  )
}

export default StudentsReq

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 16,
    paddingBottom: 40,
  },

  requestCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    elevation: 4,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  profileSection: {
    flexDirection: 'row',
    flex: 1,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  studentName: {
    fontSize: 18,
    fontWeight: '700',
  },

  regNo: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '500',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  infoSection: {
    marginTop: 22,
    gap: 14,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },

  stopsSection: {
    marginTop: 24,
  },

  stopTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },

  stopWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  stopChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 5,
  },

  stopText: {
    fontSize: 12,
    fontWeight: '600',
  },

  buttonRow: {
    marginTop: 28,
    flexDirection: 'row',
    gap: 12,
  },

  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
  },

  actionText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 120,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
})
