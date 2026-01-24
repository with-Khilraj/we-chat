import { api } from "../Api";

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

export const getMessagesByRoomId = async (accessToken, roomId, limit = 20, before = null) => {
  try {
    let url = `/api/messages/${roomId}?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    const response = await api.get(url, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
    });
    return response.data; // Returns { messages, hasMore }
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}