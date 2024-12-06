import api from "../Api";

const fetchUserData = async (accessToken) => {
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

export default fetchUserData;