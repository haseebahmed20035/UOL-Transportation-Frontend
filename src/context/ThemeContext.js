import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {

  const [darkMode, setDarkMode] = useState(true); // 👈 default dark

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const stored = await AsyncStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(JSON.parse(stored));
    }
  };

  const toggleTheme = async () => {
    const value = !darkMode;
    setDarkMode(value);
    await AsyncStorage.setItem('darkMode', JSON.stringify(value));
  };

  const theme = {
    darkMode,

    colors: {
      background: darkMode ? '#121212' : '#F5F7F6',
      option: darkMode? 'rgba(26,128,63,0.5)': 'white',
      primary: darkMode ? '#0D2E0A' : '#175812',   
      card: darkMode ? 'rgba(26,128,63,0.5)' : '#406B49',
      box: darkMode ? '#2D4733' : '#7FAF8A',      
      border: darkMode ? '#406B49' : 'rgba(26,128,63,0.5)',
      text: darkMode ? '#FFFFFF' : '#0F2F1B',
      icon: darkMode ? '#FFFFFF' : '#175812',
      dashboard: darkMode ? '#2D4733' : '#FFFFFF',
    }
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};