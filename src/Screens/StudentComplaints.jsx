import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import React, {
  useContext,
  useEffect,
  useState,
} from 'react';

import Icon from 'react-native-vector-icons/Ionicons';

import { ThemeContext }
from '../context/ThemeContext';

const BASE_URL =
  'http://192.168.100.100:5000';

const StudentsComplaints = ({
  navigation,
}) => {

  const { theme } =
    useContext(ThemeContext);

  const [complaints, setComplaints] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [selectedComplaint,
    setSelectedComplaint] =
      useState(null);

  const [modalVisible,
    setModalVisible] =
      useState(false);

  const [response,
    setResponse] =
      useState('');

  const [selectedStatus,
    setSelectedStatus] =
      useState('in_progress');

  const [sending,
    setSending] =
      useState(false);

  const [activeFilter,
    setActiveFilter] =
      useState('all');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {

    try {

      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/all-complaints`
      );

      const data = await res.json();

      setComplaints(data);

    } catch (e) {

      console.log(e);

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

  const openResponseModal = item => {

    setSelectedComplaint(item);

    setResponse(
      item.admin_response || ''
    );

    setSelectedStatus(
      item.status || 'in_progress'
    );

    setModalVisible(true);
  };

  const sendResponse = async () => {

    if (!response) {

      Alert.alert(
        'Error',
        'Please enter response'
      );

      return;
    }

    try {

      setSending(true);

      const res = await fetch(
        `${BASE_URL}/respond-complaint`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            complaint_id:
              selectedComplaint.id,

            response,

            status: selectedStatus,
          }),
        },
      );

      const data =
        await res.json();

      if (data.success) {

        Alert.alert(
          'Success',
          'Response sent successfully'
        );

        setModalVisible(false);

        fetchComplaints();

      } else {

        Alert.alert(
          'Error',
          data.message
        );
      }

    } catch (e) {

      console.log(e);

      Alert.alert(
        'Error',
        'Network request failed'
      );

    } finally {

      setSending(false);
    }
  };

  const filteredComplaints =
    activeFilter === 'all'
      ? complaints
      : complaints.filter(
          item =>
            item.status === activeFilter
        );

  const renderComplaint = ({
    item,
  }) => {

    return (
      <View style={styles.card}>

        {/* TOP */}
        <View style={styles.topRow}>

          <View style={{ flex: 1 }}>

            <Text style={styles.studentName}>
              {item.name}
            </Text>

            <Text style={styles.regNo}>
              Reg#: {item.reg_no}
            </Text>

          </View>

          <View
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  getStatusColor(
                    item.status
                  ),
              },
            ]}>

            <Text style={styles.statusText}>
              {item.status}
            </Text>

          </View>

        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          {item.title}
        </Text>

        {/* CATEGORY */}
        <View style={styles.categoryRow}>

          <Icon
            name="pricetag"
            size={16}
            color="#175812"
          />

          <Text style={styles.categoryText}>
            {item.category}
          </Text>

        </View>

        {/* DESCRIPTION */}
        <Text style={styles.description}>
          {item.description}
        </Text>

        {/* ADMIN RESPONSE */}
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

        {/* DATE */}
        <View style={styles.dateRow}>

          <Icon
            name="time-outline"
            size={15}
            color="#777"
          />

          <Text style={styles.dateText}>
            {new Date(
              item.created_at
            ).toLocaleString()}
          </Text>

        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={styles.respondBtn}
          onPress={() =>
            openResponseModal(item)
          }>

          <Icon
            name="chatbubble-ellipses"
            size={18}
            color="white"
          />

          <Text style={styles.respondBtnText}>
            Respond Complaint
          </Text>

        </TouchableOpacity>

      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            '#f5f7fb',
        },
      ]}>

      <StatusBar
        backgroundColor={
          theme.colors.primary
        }
        barStyle="light-content"
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:
              theme.colors.primary,
          },
        ]}>

        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }>

          <Icon
            name="arrow-back"
            size={26}
            color="white"
          />

        </TouchableOpacity>

        <Text style={styles.headerText}>
          Students Complaints
        </Text>

        <TouchableOpacity
          onPress={fetchComplaints}>

          <Icon
            name="refresh"
            size={24}
            color="white"
          />

        </TouchableOpacity>

      </View>

      {/* FILTERS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={
          false
        }
        style={styles.filterRow}>

        {[
          'all',
          'pending',
          'in_progress',
          'resolved',
        ].map(status => (

          <TouchableOpacity
            key={status}
            onPress={() =>
              setActiveFilter(status)
            }
            style={[
              styles.filterChip,
              activeFilter === status && {
                backgroundColor:
                  theme.colors.primary,
              },
            ]}>

            <Text
              style={[
                styles.filterText,
                activeFilter ===
                  status && {
                  color: 'white',
                },
              ]}>

              {status}

            </Text>

          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTENT */}
      {loading ? (

        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{
            marginTop: 40,
          }}
        />

      ) : filteredComplaints.length ===
        0 ? (

        <View style={styles.emptyBox}>

          <Icon
            name="document-text-outline"
            size={60}
            color="#999"
          />

          <Text style={styles.emptyText}>
            No complaints found
          </Text>

        </View>

      ) : (

        <FlatList
          data={filteredComplaints}
          keyExtractor={item =>
            item.id.toString()
          }
          renderItem={renderComplaint}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={
                fetchComplaints
              }
            />
          }
        />
      )}

      {/* RESPONSE MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide">

        <View style={styles.modalOverlay}>

          <View style={styles.modalCard}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>
                Respond Complaint
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
                }>

                <Icon
                  name="close"
                  size={24}
                  color="#111"
                />

              </TouchableOpacity>

            </View>

            {/* STATUS */}
            <Text style={styles.modalLabel}>
              Status
            </Text>

            <View style={styles.statusRow}>

              {[
                'pending',
                'in_progress',
                'resolved',
              ].map(status => (

                <TouchableOpacity
                  key={status}
                  onPress={() =>
                    setSelectedStatus(
                      status
                    )
                  }
                  style={[
                    styles.statusOption,
                    selectedStatus ===
                      status && {
                      backgroundColor:
                        getStatusColor(
                          status
                        ),
                    },
                  ]}>

                  <Text
                    style={[
                      styles.statusOptionText,
                      selectedStatus ===
                        status && {
                        color: 'white',
                      },
                    ]}>

                    {status}

                  </Text>

                </TouchableOpacity>
              ))}
            </View>

            {/* RESPONSE */}
            <Text style={styles.modalLabel}>
              Response
            </Text>

            <TextInput
              value={response}
              onChangeText={setResponse}
              multiline
              placeholder="Write response..."
              style={styles.responseInput}
              textAlignVertical="top"
            />

            {/* BTN */}
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={sendResponse}>

              {sending ? (

                <ActivityIndicator
                  color="white"
                />

              ) : (

                <>
                  <Icon
                    name="send"
                    size={18}
                    color="white"
                  />

                  <Text style={styles.sendBtnText}>
                    Send Response
                  </Text>
                </>
              )}

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
};

export default StudentsComplaints;

const styles = StyleSheet.create({

  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent:
      'space-between',
    elevation: 5,
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  filterRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    maxHeight: 70,
  },

  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#e9edf5',
    marginRight: 10,
  },

  filterText: {
    color: '#333',
    fontWeight: '600',
    textTransform:
      'capitalize',
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 24,
    padding: 18,
    elevation: 4,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },

  regNo: {
    color: '#666',
    marginTop: 4,
  },

  statusChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },

  statusText: {
    color: 'white',
    fontWeight: 'bold',
    textTransform:
      'capitalize',
    fontSize: 12,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginTop: 16,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },

  categoryText: {
    marginLeft: 6,
    color: '#175812',
    fontWeight: '600',
  },

  description: {
    color: '#444',
    marginTop: 14,
    lineHeight: 22,
  },

  responseBox: {
    backgroundColor: '#f5f7fb',
    borderRadius: 18,
    padding: 15,
    marginTop: 18,
  },

  responseLabel: {
    color: '#175812',
    fontWeight: 'bold',
    marginBottom: 6,
  },

  responseText: {
    color: '#333',
    lineHeight: 20,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  dateText: {
    marginLeft: 5,
    color: '#777',
    fontSize: 12,
  },

  respondBtn: {
    marginTop: 20,
    backgroundColor: '#175812',
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  respondBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyText: {
    marginTop: 14,
    color: '#777',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },

  modalLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontWeight: '700',
    color: '#222',
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#edf1f7',
    marginRight: 10,
    marginBottom: 10,
  },

  statusOptionText: {
    color: '#333',
    fontWeight: '600',
    textTransform:
      'capitalize',
  },

  responseInput: {
    backgroundColor: '#f5f7fb',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 140,
    color: '#111',
  },

  sendBtn: {
    marginTop: 24,
    backgroundColor: '#175812',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  sendBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});