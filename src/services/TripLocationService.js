import AsyncStorage from '@react-native-async-storage/async-storage'
import BackgroundService from 'react-native-background-actions'
import Geolocation from '@react-native-community/geolocation'
import { BASE_URL } from '../services/baseUrl'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

const getDriverId = user => {
  return user?.driver_id || user?.id || user?.user_id || user?.userId
}

const getCurrentLocation = () => {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        const latitude = Number(position?.coords?.latitude)
        const longitude = Number(position?.coords?.longitude)

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          resolve(null)
          return
        }

        resolve({ latitude, longitude })
      },
      error => {
        console.log('Background current location error:', error)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
        forceRequestLocation: true,
        showLocationDialog: true,
      },
    )
  })
}

const sendLiveLocation = async activeTrip => {
  try {
    const location = await getCurrentLocation()

    if (!location) return

    await fetch(`${BASE_URL}/update-bus-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driver_id: activeTrip.driver_id,
        bus_id: activeTrip.bus_id,
        route_id: activeTrip.route_id,
        latitude: location.latitude,
        longitude: location.longitude,
        status: 'running',
      }),
    })

    console.log('Background location sent:', location)
  } catch (error) {
    console.log('Send background location error:', error)
  }
}

const backgroundLocationTask = async taskData => {
  const { interval } = taskData

  while (BackgroundService.isRunning()) {
    const activeTripString = await AsyncStorage.getItem('activeTrip')
    const activeTrip = activeTripString ? JSON.parse(activeTripString) : null

    if (activeTrip) {
      await sendLiveLocation(activeTrip)
    }

    await sleep(interval)
  }
}

export const startTripLocationService = async trip => {
  const userString = await AsyncStorage.getItem('user')
  const user = userString ? JSON.parse(userString) : null
  const driverId = getDriverId(user)

  if (!driverId || !trip?.bus_id || !trip?.route_id) {
    console.log('Background tracking missing data:', {
      driverId,
      trip,
    })
    return
  }

  await AsyncStorage.setItem(
    'activeTrip',
    JSON.stringify({
      driver_id: driverId,
      bus_id: trip.bus_id,
      route_id: trip.route_id,
      bus_number: trip.bus_number,
      started_at: new Date().toISOString(),
    }),
  )

  const options = {
    taskName: 'UOL Transportation',
    taskTitle: 'UOL Transportation',
    taskDesc: 'Live bus tracking is running',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#175812',
    linkingURI: 'uoltransportation://trip-control',
    parameters: {
      interval: 8000,
    },
  }

  if (!BackgroundService.isRunning()) {
    await BackgroundService.start(backgroundLocationTask, options)
  }
}

export const stopTripLocationService = async () => {
  try {
    await AsyncStorage.removeItem('activeTrip')

    if (BackgroundService.isRunning()) {
      await BackgroundService.stop()
    }
  } catch (error) {
    console.log('Stop background service error:', error)
  }
}