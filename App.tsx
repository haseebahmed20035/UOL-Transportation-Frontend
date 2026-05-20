import { StyleSheet, View } from 'react-native'
import React, { useEffect } from 'react'
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/Screens/LoginScreen'
import StudentDashboard from './src/Screens/StudentDashboard'
import MyRoute from './src/Screens/MyRoute'
import AllRoutes from './src/Screens/AllRoutes'
import BusSchedule from './src/Screens/BusSchedule'
import DepartureSchedule from './src/Screens/DepartureSchedule'
import ArrivalSchedule from './src/Screens/ArrivalSchedule'
import LiveBusTracking from './src/Screens/LiveBusTracking'
import ChangeRoute from './src/Screens/ChangeRoute'
import RequestForTransport from './src/Screens/RequestForTransport'
import MyArrivalRoute from './src/Screens/MyArrivalRoute'
import MyDepartureRoute from './src/Screens/MyDepartureRoute'
import Chatbot from './src/Screens/Chatbot'
import MyPersonalInfo from './src/Screens/MyPersonalInfo'
import AdminDashboard from './src/Screens/AdminDashboard'
import DriverDashboard from './src/Screens/DriverDashboard'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AppSettings from './src/Screens/AppSettings'
import FeeVoucher from './src/Screens/FeeVoucher'
import Help from './src/Screens/Help'
import StudentManage from './src/Screens/StudentManage'
import ManageDrivers from './src/Screens/ManageDrivers'
import AllLiveTracking from './src/Screens/AllLiveTracking'
import ManageBuses from './src/Screens/ManageBuses'
import ManageRoutes from './src/Screens/ManageRoutes'
import SendNotification from './src/Screens/SendNotification'
import ManageRequests from './src/Screens/ManageRequests'
import AddBus from './src/Screens/AddBus'
import DeleteBus from './src/Screens/DeleteBus'
import UpdateBus from './src/Screens/UpdateBus'
import ViewBus from './src/Screens/ViewBus'
import ViewRoutes from './src/Screens/ViewRoutes'
import AddRoutes from './src/Screens/AddRoutes'
import UpdateRoutes from './src/Screens/UpdateRoutes'
import DeleteRoutes from './src/Screens/DeleteRoutes'
import TripControl from './src/Screens/TripControl'
import DriverMyRoute from './src/Screens/DriverMyRoute'
import BusList from './src/Screens/BusList'
import StudentsReq from './src/Screens/StudentsReq'
import AllStudents from './src/Screens/AllStudents'
import StudentComplaints from './src/Screens/StudentComplaints'
import StudentAttendance from './src/Screens/StudentAttendance'
import StudentHistory from './src/Screens/StudentHistory'
import AddStudents from './src/Screens/AddStudents'
import ChangePassword from './src/Screens/changePassword'
import StudentComplaint from './src/Screens/StudentComplaint'
import DriverList from './src/Screens/DriverList'
import AddDriver from './src/Screens/AddDriver'
import DeleteDriver from './src/Screens/DeleteDriver'
import DriverPersonalInfo from './src/Screens/DriverPersonalInfo'
import Icon from 'react-native-vector-icons/Ionicons';
import { ThemeProvider } from './src/context/ThemeContext';
import messaging
from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
  headerShown:false,
  tabBarIcon: ({color, size}) => {

    let iconName = "home";

    if(route.name === "Home"){
      iconName = "home";
    }
    else if(route.name === "Chatbot"){
      iconName = "chatbubble-ellipses";
    }

    return <Icon name={iconName} size={size} color={color}/>
  }
})}
>
      <Tab.Screen name="Home" component={StudentDashboard} />
      <Tab.Screen name="Chatbot" component={Chatbot} />
    </Tab.Navigator>
  );
}

const App = () => {

  useEffect(() => {

    const unsubscribe =
      messaging().onMessage(
        async remoteMessage => {

          console.log(
            '🔥 FOREGROUND MESSAGE:',
            remoteMessage
          );

          Alert.alert(
            remoteMessage?.notification?.title ||
              'Notification',

            remoteMessage?.notification?.body ||
              'New message'
          );
        }
      );

    return () => unsubscribe();

  }, []);
  return (
    <View style={{ flex: 1 }}>
      <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Tabs" component={BottomTabs} />
        <Stack.Screen name="MyRoute" component={MyRoute} />
        <Stack.Screen name="AllRoutes" component={AllRoutes} />
        <Stack.Screen name="BusSchedule" component={BusSchedule} />
        <Stack.Screen name="DepartureSchedule" component={DepartureSchedule} />
        <Stack.Screen name="ArrivalSchedule" component={ArrivalSchedule} />
        <Stack.Screen name="LiveBusTracking" component={LiveBusTracking} />
        <Stack.Screen name="ChangeRoute" component={ChangeRoute} />
        <Stack.Screen name="RequestForTransport" component={RequestForTransport} />
        <Stack.Screen name="MyArrivalRoute" component={MyArrivalRoute} />
        <Stack.Screen name="MyDepartureRoute" component={MyDepartureRoute} />
        <Stack.Screen name="MyPersonalInfo" component={MyPersonalInfo} />
        <Stack.Screen name="AppSettings" component={AppSettings} />
        <Stack.Screen name="FeeVoucher" component={FeeVoucher} />
        <Stack.Screen name="Help" component={Help} />
        <Stack.Screen name="DriverDashboard" component={DriverDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="StudentManage" component={StudentManage} />
        <Stack.Screen name="AllLiveTracking" component={AllLiveTracking} />
        <Stack.Screen name="ManageBuses" component={ManageBuses} />
        <Stack.Screen name="ManageDrivers" component={ManageDrivers} />
        <Stack.Screen name="ManageRequests" component={ManageRequests} />
        <Stack.Screen name="ManageRoutes" component={ManageRoutes} />
        <Stack.Screen name="SendNotification" component={SendNotification} />
        <Stack.Screen name="AddBus" component={AddBus} />
        <Stack.Screen name="DeleteBus" component={DeleteBus} />
        <Stack.Screen name="UpdateBus" component={UpdateBus} />
        <Stack.Screen name="ViewBus" component={ViewBus} />
        <Stack.Screen name="ViewRoutes" component={ViewRoutes} />
        <Stack.Screen name="AddRoutes" component={AddRoutes} />
        <Stack.Screen name="UpdateRoutes" component={UpdateRoutes} />
        <Stack.Screen name="DeleteRoutes" component={DeleteRoutes} />
        <Stack.Screen name="BusList" component={BusList} />
        <Stack.Screen name="AllStudents" component={AllStudents} />
        <Stack.Screen name="StudentsReq" component={StudentsReq} />
        <Stack.Screen name="StudentComplaints" component={StudentComplaints} />
        <Stack.Screen name="StudentAttendance" component={StudentAttendance} />
        <Stack.Screen name="StudentHistory" component={StudentHistory} />
        <Stack.Screen name="AddStudents" component={AddStudents} />
        <Stack.Screen name="ChangePassword" component={ChangePassword} />
        <Stack.Screen name="StudentComplaint" component={StudentComplaint} />
        <Stack.Screen name="DriverList" component={DriverList} />
        <Stack.Screen name="AddDriver" component={AddDriver} />
        <Stack.Screen name="DeleteDriver" component={DeleteDriver} />
        <Stack.Screen name="DriverPersonalInfo" component={DriverPersonalInfo} />
        <Stack.Screen name="DriverMyRoute" component={DriverMyRoute} />
        <Stack.Screen name="TripControl" component={TripControl} />
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
    </View>
  )
}

export default App

const styles = StyleSheet.create({})
