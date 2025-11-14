import { api, publicApi } from "../Api";

export const loginUser = async (email, password) => {
  return await api.post('/api/users/login', { email, password });
}

export const signupUser = async (userData) => {
  return await api.post('/api/users/signup', userData);
}

// Function to fetch all users except the currently logged-in user
export const fetchUserExceptCurrent = async () => {
  try {
    const response = await api.get('/api/users/all')
    return response.data.users;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // You can throw the error to handle it in the component
  }
};


// Function to fetch the profile of the logged-in user
export const fetchUserData = async () => {
  try {
    const response = await api.get('/api/users/profile')
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // You can throw the error to handle it in the component
  }
};

// Function to check username availability
export const checkUsernameAvailability = async (username) => {
  const response = await publicApi.get('/api/users/check-username', { 
    params: {username},
  });
  return response.data.available;
}

