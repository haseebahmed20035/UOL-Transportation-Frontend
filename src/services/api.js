import { BASE_URL, endPoints } from '../services/baseUrl'

export const loginUser = async (data) => {
  const response = await fetch(`${BASE_URL}/${endPoints.login}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
};