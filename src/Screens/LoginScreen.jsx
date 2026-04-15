import {
  StyleSheet,
  Text,
  View,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        '967891107317-2nje8fbbcq60u2l5bpq668brt1qrapol.apps.googleusercontent.com',
    });
  }, []);
  const handleAdminLogin = () => {
    if (username !== 'admin') {
      Alert.alert('Error', 'Admin not found');
      return;
    }

    if (password !== '1') {
      Alert.alert('Error', 'Incorrect Password');
      return;
    }

    navigation.replace('Tabs');
  };

  const handleGoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices();

    // Sign in ONLY ONCE
    const { idToken } = await GoogleSignin.signIn();

    if (!idToken) {
      throw new Error('No ID token received');
    }

    const googleCredential =
      auth.GoogleAuthProvider.credential(idToken);

    const userCredential = await auth().signInWithCredential(
      googleCredential,
    );

    const email = userCredential.user.email;

    // University email check
    if (!email.endsWith('@uol.edu.pk')) {
      Alert.alert('Only University Email Allowed');
      await auth().signOut();
      await GoogleSignin.signOut();
      return;
    }

    navigation.replace('Tabs');

  } catch (error) {
    console.log('Google Error:', error);
    Alert.alert('Google Sign-In Failed', error.message);
  }
};

  return (
    <View style={{ padding: 27 }}>
      <View style={styles.Body}>
        <Image
          source={require('../Images/logo.png')}
          style={{ width: 200, resizeMode: 'contain', alignSelf: 'center' }}
        />

        <Text style={styles.mainHeading}>UOL Transportation App</Text>
        <Text style={styles.subHeading}>
          Enter your details to log in your account
        </Text>

        <View style={{ gap: 12, paddingHorizontal: 10 }}>
          <View style={styles.textBox}>
            <TextInput
              placeholder="Admin Username"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.textBox}>
            <TextInput
              placeholder="Admin Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.LoginBtn} onPress={handleAdminLogin}>
          <Text style={styles.LoginBtnText}>Admin Login</Text>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 35,
            alignSelf: 'center',
            marginBottom: 30,
          }}
        >
          Or login using university account
        </Text>

        {/* GOOGLE LOGIN BUTTON */}
        <TouchableOpacity onPress={handleGoogleLogin}>
          <Image
            source={require('../Images/google.png')}
            style={{
              resizeMode: 'contain',
              alignSelf: 'center',
              height: 25,
              width: 25,
            }}
          />
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
  forgotText: {
    fontSize: 12,
    marginTop: 15,
    color: 'blue',
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginRight: 10,
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
    fontSize: 20,
  },
});
