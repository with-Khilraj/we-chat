import { api, publicApi } from "../api/apiClient";

export const loginUser = async (email, password) => {
  return await api.post('/api/auth/login', { email, password });
}

export const signupUser = async (userData) => {
  return await api.post('/api/auth/signup', userData);
}

// Function to fetch all users except the currently logged-in user
export const fetchUserExceptCurrent = async () => {
  try {
    const response = await api.get('/api/users/all')
    return response.data.users;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};


// Function to fetch the profile of the logged-in user
export const fetchUserData = async () => {
  try {
    const response = await api.get('/api/users/profile')
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

// Function to update user profile
export const updateProfile = async (profileData) => {
  const formData = new FormData();
  if (profileData.bio !== undefined) formData.append('bio', profileData.bio);
  if (profileData.avatar) formData.append('avatar', profileData.avatar);

  const response = await api.put('/api/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.user;
};

// Function to check username availability
export const checkUsernameAvailability = async (username) => {
  const response = await publicApi.get('/api/users/check-username', {
    params: { username },
  });
  return response.data.available;
}

