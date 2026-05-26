import React, { createContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [currentRole, setCurrentRole] = useState('student')

  useEffect(() => {
    loadTheme()
  }, [])

  const getCurrentUserRole = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user')
      const user = storedUser ? JSON.parse(storedUser) : null

      return user?.role || 'student'
    } catch (error) {
      console.log('Get current user role error:', error)
      return 'student'
    }
  }

  const getThemeStorageKey = role => {
    return `${role}_darkMode`
  }

  const loadTheme = async () => {
    try {
      const role = await getCurrentUserRole()
      setCurrentRole(role)

      const stored = await AsyncStorage.getItem(getThemeStorageKey(role))

      if (stored !== null) {
        setDarkMode(JSON.parse(stored))
      } else {
        setDarkMode(false)
      }
    } catch (error) {
      console.log('Load theme error:', error)
      setDarkMode(false)
    }
  }

  const toggleTheme = async () => {
    try {
      const role = await getCurrentUserRole()
      setCurrentRole(role)

      const value = !darkMode

      setDarkMode(value)

      await AsyncStorage.setItem(
        getThemeStorageKey(role),
        JSON.stringify(value),
      )
    } catch (error) {
      console.log('Toggle theme error:', error)
    }
  }

  const theme = {
    darkMode,

    colors: {
      background: darkMode ? '#121212' : '#F5F7F6',
      option: darkMode ? 'rgba(26,128,63,0.5)' : 'white',
      primary: darkMode ? '#0D2E0A' : '#175812',
      card: darkMode ? 'rgba(26,128,63,0.5)' : '#406B49',
      box: darkMode ? '#2D4733' : '#7FAF8A',
      border: darkMode ? '#406B49' : 'rgba(26,128,63,0.5)',
      text: darkMode ? '#FFFFFF' : '#0F2F1B',
      icon: darkMode ? '#FFFFFF' : '#175812',
      dashboard: darkMode ? '#2D4733' : '#FFFFFF',
      headerText: darkMode ? '#FFFFFF' : '#ffffff',
    },
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        reloadTheme: loadTheme,
        currentRole,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}