import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const BusList = ({ navigation }) => {
  const [buses, setBuses] = useState([]);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    fetch('http://192.168.100.100:5000/buses')
      .then(res => res.json())
      .then(data => setBuses(data))
      .catch(err => console.log(err));
  }, []);

  return (
    <View>
     <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
    
            <Text style={styles.headerText}>View Bus</Text>
            <View style={{ width: 26 }} />
          </View>
    <FlatList
      data={buses}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={{
            padding: 15,
            margin: 10,
            backgroundColor: '#fff',
            borderRadius: 10,
            elevation: 2,
            gap:4
          }}
          onPress={() =>
            navigation.navigate('ViewBus', { busId: item.id }) 
          }
        >
          <Text style={{ fontWeight: 'bold' }}>{item.bus_number}</Text>
          <View style={{flexDirection:'row', justifyContent:"space-between", alignItems: 'center',}}>
            <View>
              <Text>Driver: {item.driver_name}</Text>
              <Text>Route: {item.route_name}</Text>
            </View>
          <Icon name='enter-outline' size={35} color={theme.colors.primary}/>
          </View>
        </TouchableOpacity>
      )}
    />
    </View>
  );
};

export default BusList;
const styles=StyleSheet.create({
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
})