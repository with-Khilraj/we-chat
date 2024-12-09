import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import api from "../Api";

import "../styles/chatContainer.css";

const socket = io("http://localhost:5000"); // this is basically backend url

const ChatContainer = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {

    if (selectedUser) {
      // Join a chat room
      const roomId = [currentUser._id, selectedUser._id].sort().join("-");
      socket.emit("join-room", roomId);

      const fetchChatHistory = async () => {
        try {
          const accessToken = localStorage.getItem("accessToken");
          const response = await api.get(`/api/messages/${selectedUser._id}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          setMessages(response.data.messages);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      };
      fetchChatHistory();

      // listen for new messages
      socket.on("receive-message", (data) => {
        // only add the message if it's not already in the state
        if(!messages.find((msg) => msg._id === data._id)) {
        setMessages((prevMessages) => [...prevMessages, data]);
        };
        // setMessages((prevMessages) => [...prevMessages, data]);
      });
    }
  }, [selectedUser, currentUser]);

  // Handle send message button
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      roomId: [currentUser._id, selectedUser._id].sort().join("-"),
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      content: newMessage,
    };

    try {
      // Emit message via socket.io
      socket.emit("send-message", messageData);

      // save the message to the database
      const accessToken = localStorage.getItem("accessToken");
      const response = await api.post("/api/messages/", messageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Add the message locally iif it's not already present
      if (!messages.find((msg) => msg._id === response.data._id)) {
        setMessages((prevMessages) => [...prevMessages, response.data]);
      }
      // setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    } catch (error) {
      console.error("Errro while sending message:", error);
    }
  };

  if (!selectedUser) {
    return (
      <div className="unselected-chat">Select a user to start chatting!</div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-avatar">
          {selectedUser.avatar ? (
            <img src={selectedUser.avatar} alt="" />
          ) : (
            <span>{selectedUser.username.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h3 className="chat-username">{selectedUser.username}</h3>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${
              message.senderId === currentUser._id ? "sent" : "received"
            }`}
          >
            <p>{message.content}</p>
          </div>
        ))}
      </div>

      {/* message input */}
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatContainer;
