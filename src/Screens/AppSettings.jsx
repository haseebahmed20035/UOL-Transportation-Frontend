import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ScrollView,
  Alert
} from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const AppSettings = ({ navigation }) => {

  const { theme, toggleTheme } = useContext(ThemeContext);

  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const notif = await AsyncStorage.getItem('notifications');
    if (notif !== null) setNotifications(JSON.parse(notif));
  };

  const toggleNotifications = async () => {
    const value = !notifications;
    setNotifications(value);
    await AsyncStorage.setItem('notifications', JSON.stringify(value));
  };

  const clearRecentActivities = async () => {
    await AsyncStorage.removeItem('recentScreens');
    Alert.alert("Cleared", "Recent activities removed");
  };

  const signOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel" },
      { text: "Logout", onPress: () => navigation.replace('Login') }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>App Settings</Text>

        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={{ padding: 15 }}>

        {/* APPEARANCE */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Appearance
        </Text>

        <View style={[styles.option, { backgroundColor: theme.colors.option }]}>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="moon-outline" size={22} color={theme.colors.icon} />
              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                Dark Mode
              </Text>
            </View>

            <Switch
              value={theme.darkMode}
              onValueChange={toggleTheme}
            />
          </View>

        </View>

        {/* NOTIFICATIONS */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Notifications
        </Text>

        <View style={[styles.option, { backgroundColor: theme.colors.option }]}>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="notifications-outline" size={22} color={theme.colors.icon} />
              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                Enable Notifications
              </Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
            />
          </View>

        </View>

        {/* DATA */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          App Data
        </Text>

        <View style={[styles.option, { backgroundColor: theme.colors.option }]}>

          <TouchableOpacity style={styles.row} onPress={clearRecentActivities}>
            <View style={styles.rowLeft}>
              <Icon name="trash-outline" size={22} color={theme.colors.icon} />
              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                Clear Recent Activities
              </Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* ABOUT */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About
        </Text>

        <View style={[styles.option, { backgroundColor: theme.colors.option }]}>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Icon name="information-circle-outline" size={22} color={theme.colors.icon} />
              <Text style={[styles.rowText, { color: theme.colors.text }]}>
                Version
              </Text>
            </View>

            <Text style={{ color: theme.colors.text }}>1.0</Text>
          </View>

        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Icon name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default AppSettings;

const styles = StyleSheet.create({

container:{
flex:1
},

header:{
flexDirection:'row',
backgroundColor:'#175812',
paddingVertical:16,
paddingHorizontal:18,
alignItems:'center',
justifyContent:'space-between'
},

headerText:{
color:'white',
fontSize:17,
fontWeight:'bold'
},

sectionTitle:{
fontWeight:'bold',
marginBottom:6,
marginTop:20
},

option:{
borderRadius:12,
padding:15,
elevation:2
},

row:{
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center',
paddingVertical:10
},

rowLeft:{
flexDirection:'row',
alignItems:'center',
gap:10
},

rowText:{
fontSize:15
},

logoutBtn:{
marginTop:40,
backgroundColor:'#d9534f',
height:45,
borderRadius:10,
justifyContent:'center',
alignItems:'center',
flexDirection:'row',
gap:8
},

logoutText:{
color:'white',
fontWeight:'bold'
}

});

const lightStyles = StyleSheet.create({

background:{
backgroundColor:'#F5F7F6'
},

option:{
backgroundColor:'white'
},

text:{
color:'black'
}

});

const darkStyles = StyleSheet.create({

background:{
backgroundColor:'#1E1E1E'
},

option:{
backgroundColor:'#2B2B2B'
},

text:{
color:'white'
}

});