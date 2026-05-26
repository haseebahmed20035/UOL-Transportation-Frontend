import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL} from '../services/baseUrl'

const complaintCategories = [
  'Bus Delay',
  'Driver Issue',
  'Route Issue',
  'Seat Issue',
  'Safety Issue',
  'App Issue',
];

const StudentComplaint = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('Bus Delay');

  const [loading, setLoading] = useState(false);

  const [studentId, setStudentId] = useState(null);

  const [complaints, setComplaints] = useState([]);

  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    loadStudent();
  }, []);

  const loadStudent = async () => {
    try {
      const id =
        await AsyncStorage.getItem('studentId');

      if (id) {
        setStudentId(id);

        fetchComplaints(id);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fetchComplaints = async id => {
    try {
      setFetching(true);

      const response = await fetch(
        `${BASE_URL}/student-complaints/${id}`,
      );

      const data = await response.json();

      setComplaints(data);
    } catch (e) {
      console.log(e);
    } finally {
      setFetching(false);
    }
  };

  const submitComplaint = async () => {
    if (!title || !description) {
      Alert.alert(
        'Error',
        'Please fill all fields',
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${BASE_URL}/add-complaint`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            student_id: studentId,
            title,
            category: selectedCategory,
            description,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          'Complaint submitted successfully',
        );

        setTitle('');
        setDescription('');

        fetchComplaints(studentId);
      } else {
        Alert.alert(
          'Error',
          data.message || 'Something went wrong',
        );
      }
    } catch (e) {
      console.log(e);

      Alert.alert(
        'Error',
        'Network request failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'pending':
        return '#ff9800';

      case 'in_progress':
        return '#2196f3';

      case 'resolved':
        return '#4caf50';

      default:
        return 'gray';
    }
  };

  const renderComplaint = ({ item }) => {
    return (
      <View style={styles.complaintCard}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {item.title}
            </Text>

            <Text style={styles.categoryText}>
              {item.category}
            </Text>
          </View>

          <View
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  getStatusColor(item.status),
              },
            ]}>
            <Text style={styles.statusText}>
              {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.descriptionText}>
          {item.description}
        </Text>

        {item.admin_response ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseLabel}>
              Admin Response
            </Text>

            <Text style={styles.responseText}>
              {item.admin_response}
            </Text>
          </View>
        ) : null}

        <View style={styles.bottomRow}>
          <Icon
            name="time-outline"
            size={15}
            color="#777"
          />

          <Text style={styles.timeText}>
            {new Date(
              item.created_at,
            ).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#175812"
        barStyle="light-content"
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-back"
            size={24}
            color="white"
          />
        </TouchableOpacity>

        <Text style={styles.headerText}>
          Student Complaint
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}>
        {/* TOP CARD */}
        <View style={styles.topCard}>
          <View style={styles.iconCircle}>
            <Icon
              name="chatbox-ellipses"
              size={30}
              color="#175812"
            />
          </View>

          <Text style={styles.topTitle}>
            Raise a Complaint
          </Text>

          <Text style={styles.topSubtitle}>
            Submit transport related issues and
            track complaint status in real-time.
          </Text>
        </View>

        {/* FORM */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>
            Complaint Title
          </Text>

          <TextInput
            placeholder="Enter complaint title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <Text style={styles.inputLabel}>
            Category
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 18 }}>
            {complaintCategories.map(category => (
              <TouchableOpacity
                key={category}
                onPress={() =>
                  setSelectedCategory(category)
                }
                style={[
                  styles.categoryChip,
                  selectedCategory === category && {
                    backgroundColor: '#175812',
                  },
                ]}>
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory ===
                      category && {
                      color: 'white',
                    },
                  ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>
            Description
          </Text>

          <TextInput
            placeholder="Explain your issue..."
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.descriptionInput}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={submitComplaint}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon
                  name="send"
                  size={18}
                  color="white"
                />

                <Text style={styles.submitBtnText}>
                  Submit Complaint
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* HISTORY */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            Complaint History
          </Text>

          <TouchableOpacity
            onPress={() =>
              fetchComplaints(studentId)
            }>
            <Icon
              name="refresh"
              size={22}
              color="#175812"
            />
          </TouchableOpacity>
        </View>

        {fetching ? (
          <ActivityIndicator
            size="large"
            color="#175812"
            style={{ marginTop: 30 }}
          />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyCard}>
            <Icon
              name="document-text-outline"
              size={45}
              color="#999"
            />

            <Text style={styles.emptyText}>
              No complaints found
            </Text>
          </View>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={item =>
              item.id.toString()
            }
            renderItem={renderComplaint}
            scrollEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={fetching}
                onRefresh={() =>
                  fetchComplaints(studentId)
                }
              />
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

export default StudentComplaint;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },

  header: {
    flexDirection: 'row',
    backgroundColor: '#175812',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  topCard: {
    backgroundColor: 'white',
    margin: 18,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
  },

  iconCircle: {
    width: 75,
    height: 75,
    borderRadius: 100,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  topTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
  },

  topSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    borderRadius: 24,
    padding: 20,
    elevation: 4,
  },

  inputLabel: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    marginTop: 8,
  },

  input: {
    backgroundColor: '#f5f7fb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 55,
    color: '#111',
    marginBottom: 12,
  },

  descriptionInput: {
    backgroundColor: '#f5f7fb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 15,
    minHeight: 130,
    color: '#111',
    textAlignVertical: 'top',
  },

  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#edf1f7',
    marginRight: 10,
  },

  categoryChipText: {
    fontWeight: '600',
    color: '#333',
  },

  submitBtn: {
    backgroundColor: '#175812',
    marginTop: 20,
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  historyHeader: {
    marginTop: 28,
    marginHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },

  complaintCard: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    elevation: 3,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#111',
  },

  categoryText: {
    color: '#777',
    marginTop: 5,
  },

  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },

  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'capitalize',
    fontSize: 12,
  },

  descriptionText: {
    marginTop: 16,
    color: '#444',
    lineHeight: 22,
  },

  responseBox: {
    backgroundColor: '#f5f7fb',
    borderRadius: 16,
    padding: 15,
    marginTop: 18,
  },

  responseLabel: {
    fontWeight: 'bold',
    color: '#175812',
    marginBottom: 6,
  },

  responseText: {
    color: '#333',
    lineHeight: 20,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },

  timeText: {
    marginLeft: 6,
    color: '#777',
    fontSize: 12,
  },

  emptyCard: {
    alignItems: 'center',
    marginTop: 40,
  },

  emptyText: {
    marginTop: 12,
    color: '#888',
    fontSize: 15,
  },
});