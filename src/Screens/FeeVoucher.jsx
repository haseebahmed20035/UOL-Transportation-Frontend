import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

const FeeVoucher = ({navigation}) => {
  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Fee Voucher</Text>
        <View style={{ width: 26 }} />
      </View>
    </View>
  );
};

export default FeeVoucher;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: '#175812',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
