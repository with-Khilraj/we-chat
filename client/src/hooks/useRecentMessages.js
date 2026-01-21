import { useState, useEffect, useCallback } from "react";
import { getRecentMessages } from "../services/chatService";
import socket from "../utils/useSocket";

export const useRecentMessages = (loggedInUser, accessToken) => {
  const [recentMessages, setRecentMessages] = useState({});

  // helper:: update messages function
  const updateRecentMessages = useCallback(
    (newMessages) => {
      setRecentMessages((prevMessages) => {
        const updatedMessages = { ...prevMessages };
        newMessages.forEach((message) => {
          const senderID = message.senderId.toString();
          const receiverID = message.receiverId.toString(); // userId = receiverId
          const otherUserID =
            senderID === loggedInUser._id.toString() ? receiverID : senderID;
          // const isSeen = message.seen || false;
          const isSeen = message.status === 'seen';

          // Determine the display message based on the messageType
          let displayMessage;
          if (message.messageType === 'text') {
            // we call message.message not message.content because in server-side, 
            // we save the content and file both on 'message' while sending the message to the client
            const messageContent = message.message || "";
            console.log("message::::", message);
            console.log("messageContent::::", messageContent);
            displayMessage =
              senderID === loggedInUser._id.toString()
                ? `You: ${messageContent}`
                : messageContent;
          } else {
            const messageTypeMap = {
              "photo": 'a photo',
              "video": 'a video',
              "file": 'a file',
              "audio": 'an audio',
            };
            const messageTypeText = messageTypeMap[message.messageType];
            displayMessage =
              senderID === loggedInUser._id.toString()
                ? `You sent ${messageTypeText}`
                : `Sent you ${messageTypeText}`;
          }

          // Calculate unread count (only for messages received by current user)
          let newUnreadCount = prevMessages[otherUserID]?.unreadCount || 0;
          if (receiverID === loggedInUser._id.toString() && !isSeen) {
            newUnreadCount += 1; // Increment for unseen received messages
          } else if (isSeen) {
            newUnreadCount = 0; // Reset if seen
          } else if (senderID === loggedInUser._id.toString()) {
            newUnreadCount = 0; // No unread count for sent messages
          }

          updatedMessages[otherUserID] = {
            message: displayMessage,
            timestamp: new Date(message.lastMessageTimestamp).getTime(),
            seen: senderID === loggedInUser._id.toString() ? true : isSeen,
            unreadCount: newUnreadCount,
            lastMessageId: message._id,
          };
          // updatedMessages[message.userId] = displayMessage;
        });
        return updatedMessages;
      });
    },
    [loggedInUser?._id]
  );

  // Initial fetch of recent messages
  useEffect(() => {
    if (loggedInUser) {
      const fetchRecentMessages = async () => {
        try {
          const messages = await getRecentMessages(accessToken);
          updateRecentMessages(messages);
          socket.emit("online-user", loggedInUser._id);
        } catch (error) {
          console.error(`Error fetching recent messages: ${error}`);
        }
      };
      fetchRecentMessages();
    }
  }, [loggedInUser, accessToken, updateRecentMessages]);


  // Socket listener for new messages
  useEffect(() => {
    const handleNewMessage = (message) => updateRecentMessages([message]);
    const handleMessageStatus = (data) => {
      if (data.status === "seen" && data.messageIds) {
        setRecentMessages((prevMessages) => {
          const updated = { ...prevMessages };
          Object.keys(updated).forEach((userId) => {
            if (
              data.messageIds.includes(updated[userId]?.lastMessageId) &&
              !updated[userId]?.seen
            ) {
              updated[userId] = { ...updated[userId], seen: true, unreadCount: 0 };
            }
          });
          return updated;
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message-seen", handleMessageStatus);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message-seen", handleMessageStatus);
    };
  }, [updateRecentMessages]);

  return { recentMessages, updateRecentMessages, setRecentMessages };

}