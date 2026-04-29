import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const BASE_URL = "http://192.168.100.100:5000/api"; // 🔥 your IP

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '967891107317-2nje8fbbcq60u2l5bpq668brt1qrapol.apps.googleusercontent.com',
    });
  }, []);
const getAlertMessage = (value, fallback = "Something went wrong") => {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === "string") return item;
      return JSON.stringify(item);
    }).join("\n");
  }

  if (value && typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    if (typeof value.msg === "string") return value.msg;

    return JSON.stringify(value, null, 2);
  }

  return fallback;
};
  // ================= ADMIN LOGIN =================
  const handleAdminLogin = async () => {
  if (!username || !password) {
    Alert.alert("Error", "Please enter username and password");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: username.trim(),
        password: password.trim(),
      }),
    });

    const data = await response.json();

    console.log("ADMIN LOGIN RESPONSE:", JSON.stringify(data, null, 2));

    if (data.success) {
      const role = data.user?.role;

if (role === "admin") {
  navigation.replace("AdminDashboard");
} else if (role === "student") {
  navigation.replace("Tabs");
} else if (role === "driver") {
  navigation.replace("DriverDashboard");
} else {
  Alert.alert("Error", "Unknown role");
}
    } else {
      Alert.alert(
        "Login Failed",
        getAlertMessage(data.message, "Invalid credentials")
      );
    }
  } catch (error) {
    console.log("ADMIN ERROR:", error);

    Alert.alert(
      "Error",
      getAlertMessage(error?.message || error, "Something went wrong")
    );
  } finally {
    setLoading(false);
  }
};

  // ================= GOOGLE LOGIN =================
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();

      const email = userInfo.user.email;

      console.log("Google Email:", email);

      // 🔥 SEND TO BACKEND
      const response = await fetch(`${BASE_URL}/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      console.log("GOOGLE LOGIN RESPONSE:", data);

      if (data.success) {
        const role = data.user.role;

        if (role === "student") {
          navigation.replace("Tabs");
        } else if (role === "driver") {
          navigation.replace("DriverDashboard");
        } else if (role === "admin") {
          navigation.replace("AdminDashboard");
        } else {
          Alert.alert("Error", "Unknown role");
        }
      } else {
        Alert.alert("Login Failed", getAlertMessage(data.message, "User not found"));
      }

    } catch (error) {
      console.log("GOOGLE ERROR:", error);

      Alert.alert(
        "Google Sign-In Failed",
        typeof error?.message === "string"
          ? error.message
          : JSON.stringify(error)
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <View style={{ padding: 27 }}>
      <View style={styles.Body}>
        <Image
          source={require('../Images/logo.png')}
          style={{ width: 200, resizeMode: 'contain', alignSelf: 'center' }}
        />

        <Text style={styles.mainHeading}>UOL Transportation App</Text>
        <Text style={styles.subHeading}>
          Enter admin details OR use Google login
        </Text>

        {/* ADMIN LOGIN */}
        <View style={{ gap: 12, paddingHorizontal: 10 }}>
          <View style={styles.textBox}>
            <TextInput
              placeholder="Admin Email"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.textBox}>
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={{ color: "black" }}
            />
          </View>
          
        </View>

        <TouchableOpacity style={styles.LoginBtn} onPress={handleAdminLogin}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.LoginBtnText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* GOOGLE LOGIN */}
        <Text style={{ marginTop: 35, alignSelf: 'center' }}>
          OR
        </Text>

        <TouchableOpacity
          style={[styles.LoginBtn, { backgroundColor: "#4285F4" }]}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.LoginBtnText}>Login with Google</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  mainHeading: {
    color: '#113d1ece',
    textAlign: 'center',
    fontSize: 25,
    fontWeight: 'bold',
  },
  Body: {
    backgroundColor: 'white',
    elevation: 2,
    minHeight: 700,
    padding: 10,
    borderRadius: 10,
  },
  subHeading: {
    textAlign: 'center',
    marginTop: 15,
    color: '#113d1eef',
    marginBottom: 40,
  },
  textBox: {
    borderWidth: 1,
    borderColor: 'lightgray',
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 2,
    paddingHorizontal: 10,
  },
  LoginBtn: {
    marginTop: 20,
    backgroundColor: '#113d1eef',
    width: '90%',
    alignSelf: 'center',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
  },
  LoginBtnText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});