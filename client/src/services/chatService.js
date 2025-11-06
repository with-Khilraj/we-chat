import {api} from "../Api";

export const getRecentMessages = async (accessToken) => {
  try {
    const response = await api.get('/api/messages/recent-messages', {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
    });
    return response.data.recentMessages;
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    throw error;
  }
}