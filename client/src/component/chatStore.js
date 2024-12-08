import api from "../Api";

export const getAllChats = async (accessToken, selectedUser) => {
  try {
    const response = await api.get(`/api/message/${selectedUser._id}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    });
    return response.data.messages;
  } catch (error) {
    console.error("Error fetching chat history:", error);
  }
}