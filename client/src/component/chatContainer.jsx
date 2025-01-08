import React, { useEffect, useRef, useState } from "react";
import api from "../Api";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import "../styles/chatContainer.css";
import socket from "./socket";
import { useOnlineUsers } from "../context/onlineUsersContext";

const ChatContainer = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef(null);
  const onlineUsers = useOnlineUsers();

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

      const handleReceiveMessage = (data) => {
        console.log("New message received::", data);

        setMessages((prevMessages) => {
          // console.log("Previous Message:::", prevMessages);
          if (!prevMessages.some((msg) => msg._id === data._id)) {
            const updateMessages = [...prevMessages, data];
            console.log("Updated messages:::", updateMessages);
            return updateMessages;
          }
          return prevMessages;
        });
      };

      socket.on("receive-message", handleReceiveMessage);

      return () => {
        socket.off("receive-message", handleReceiveMessage);
      };

      // // listen for new messages
      // socket.on("receive-message", (data) => {
      //   // only add the message if it's not already in the state
      //   if(!messages.find((msg) => msg._id === data._id)) {
      //   setMessages((prevMessages) => [...prevMessages, data]);
      //   };
      //   // setMessages((prevMessages) => [...prevMessages, data]);
      // });
    }
  }, [selectedUser, currentUser]);

  // Handle send message button
  // const handleSendMessage = async () => {
  //   if (!newMessage.trim()) return;

  //   const messageData = {
  //     roomId: [currentUser._id, selectedUser._id].sort().join("-"),
  //     senderId: currentUser._id,
  //     receiverId: selectedUser._id,
  //     content: newMessage,
  //   };

  //   try {
  //     // Emit message via socket.io
  //     socket.emit("send-message", messageData);

  //     // save the message to the database
  //     const accessToken = localStorage.getItem("accessToken");
  //     const response = await api.post("/api/messages/", messageData, {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //       },
  //     });

  //     // Add the message locally iif it's not already present
  //     // setMessages((prevMessages) => {
  //     //   const isDuplicate = prevMessages.some((msg) => msg._id === response.data._id);
  //     //   if (!isDuplicate) {
  //     //     return [...prevMessages, response.data];
  //     //   }
  //     //   return prevMessages;
  //     // });

  //     // setMessages((prevMessages) => {
  //     //   console.log("Previous messages (before sending)::::", prevMessages);
  //     //   if (!prevMessages.find((msg) => msg._id === response.data._id)) {
  //     //     const updateMessages = [...prevMessages, response.data];
  //     //     console.log("updated messages after sending:::", updateMessages);
  //     //     return updateMessages;
  //     //   }
  //     //   return prevMessages;
  //     // });
  //     setNewMessage("");
  //   } catch (error) {
  //     console.error("Errro while sending message:", error);
  //   }
  // };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageId = uuidv4();
    const messageData = {
      _id: messageId,
      roomId: [currentUser._id, selectedUser._id].sort().join("-"),
      senderId: currentUser._id,
      receiverId: selectedUser._id,
      content: newMessage,
    };

    try {
      setMessages((prevMessages) => [...prevMessages, messageData]); // Optimistic update
      setNewMessage("");

      socket.emit("send-message", messageData);

      const accessToken = localStorage.getItem("accessToken");
      const response = await api.post("/api/messages/", messageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update message with actual ID from server response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === Date.now() ? { ...msg, _id: response.data._id } : msg
        )
      );
    } catch (error) {
      console.error("Error while sending message:", error);
    }
  };

  useEffect(() => {
    if (messages.length) {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Helper: check if there's a 30 minute or more gap between two messages
  const shouldDisplayTimeStamp = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentTime = moment(currentMessage.createdAt);
    const previousTime = moment(previousMessage.createdAt);
    return currentTime.diff(previousTime, "minutes") >= 30;
  };

  // Helper: check if a message should start a new group
  const shouldStartNewGroup = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;

    const currentTime = moment(currentMessage.createdAt);
    const previousTime = moment(previousMessage.createdAt);

    return (
      currentMessage.senderId !== previousMessage.senderId ||
      currentTime.diff(previousTime, "minutes") >= 1
    );
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
          {onlineUsers.includes(selectedUser._id) && (
            <span className="online-indicator"></span>
          )}
        </div>
        <h3 className="chat-username">
          {selectedUser.username}
          <br></br>
          {onlineUsers.includes(selectedUser._id) && (
            <span className="online-status">Active now</span>
          )}
        </h3>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser._id;
          const senderUser = isCurrentUser ? currentUser : selectedUser;
          const previousMessage = messages[index - 1];
          const showTimeStamp = shouldDisplayTimeStamp(
            message,
            previousMessage
          );
          const startNewGroup = shouldStartNewGroup(message, previousMessage);

          return (
            <div key={index}>
              {/* show timestamp if necessary */}
              {showTimeStamp && (
                <div className="message-timestamp">
                  {moment(message.createdAt || Date.now()).format(
                    "D MMM YYYY, HH:mm"
                  )}
                </div>
              )}

              <div
                className={`message-group ${
                  isCurrentUser ? "sent" : "received"
                }`}
              >
                {!isCurrentUser && startNewGroup && (
                  <div className="avatar-content">
                    {/* Avatar or Initial char of username */}
                    <div className="message-avatar">
                      {senderUser.avatar ? (
                        <img src={senderUser.avatar} alt="" />
                      ) : (
                        <span className="message-initial">
                          {senderUser.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`message ${
                  message.senderId === currentUser._id ? "sent" : "received"
                }`}
              >
                <p>{message.content}</p>
              </div>

              <div ref={messageEndRef}></div>
            </div>
          );
        })}
      </div>

      {/* <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`message ${
              message.senderId === currentUser._id ? "sent" : "received"
            }`}
          >
            <p>{message.content}</p>
          </div>
        ))}
      </div> */}

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
