import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeContext } from '../context/ThemeContext';

const Help = ({navigation}) => {
    const { theme } = useContext(ThemeContext);
  
   const menuItems = [
      {
        title: 'Complaint',
        icon: 'add',
        screen: 'StudentComplaint',
      },
    ];
  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Help</Text>
        <View style={{ width: 26 }} />
      </View>
      {/* CONTENT */}
            <View style={styles.content}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.box,
                    {
                      backgroundColor: theme.colors.box,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <Icon name={item.icon} size={30} color={theme.colors.icon} />
      
                  <Text style={[styles.boxText, { color: theme.colors.text }]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
    </View>
  );
};

export default Help;

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
   content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  box: {
    width: '47%',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },

  boxText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
