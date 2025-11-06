import api from "../Api";

export const loginUser = async (email, password) => {
  return await api.post('/api/users/login', { email, password });
}

export const singupUser = async (userData) => {
  return await api.post('/api/users/signup', userData);
}

// Function to fetch all users except the currently logged-in user
export const fetchUserExceptCurrent = async (accessToken) => {
  try {
    const response = await api.get('/api/users/all', {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    return response.data.users;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // You can throw the error to handle it in the component
  }
};


// Function to fetch the profile of the logged-in user
export const fetchUserData = async (accessToken) => {
  try {
    const response = await api.get('/api/users/profile', {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error; // You can throw the error to handle it in the component
  }
};

