// utils/notificationHelper.js

import axios from 'axios'
import { BASE_URL, endPoints } from '../services/baseUrl'

export const fetchAndShowUserNotifications = async ({
  userId,
  role,
  setNotifications,
}) => {
  if (!userId) return

  try {
    const response = await axios.get(
      `${BASE_URL}/${endPoints.getUserNotifications}/${userId}`
    )

    const notifications = response.data?.notifications || []

    setNotifications?.(notifications)
  } catch (error) {
    console.log(
      'Fetch user notifications error:',
      error?.response?.data || error
    )
  }
}