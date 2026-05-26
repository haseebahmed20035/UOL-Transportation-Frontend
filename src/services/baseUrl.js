export const BASE_URL = `https://uol-transportation-backend-production.up.railway.app`

export const endPoints = {
  student: `student`,
  addStudent: `add-student`,
  driver: `driver`,
  myRoute: `my-route`,

  login: `auth/login`,
  loginBaseUrl: `${BASE_URL}/api`,

  addBus: `add-bus`,
  routes: `routes`,
  availableDrivers: `available-drivers`,

  sendAdminNotification: `admin/send-notification`,
  getUserNotifications: `user-notifications`,
  markNotificationRead: `user-notifications/read`,
  unreadNotificationCount: `user-notifications/unread-count`,
  clearUserNotifications: 'clear-user-notifications',
  routesWithStops: `routes-with-stops`,
  requestTransport:`request-transport`,
  updateRoute:`update-route`,
  adminDashboardStats: `admin-dashboard-stats`,
  addRoute: `add-route`,
  sendOtp:`send-otp`,
  changePassword:`change-password`
}