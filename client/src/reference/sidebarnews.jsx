/*useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const getUserData = async () => {
      try {
        const { _id } = await fetchUserData(accessToken);
        setLoggedInUser({ _id });
      } catch (error) {
        console.log("Error fetching username:", error);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    const getUserExceptCurrent = async () => {
      try {
        const response = await fetchUserExceptCurrent(accessToken);
        setUsers(response);
      } catch (error) {
        console.log("Error fetching user expect current:", error);
      }
    };
    getUserExceptCurrent();
  }, []);


  useEffect(() => {
    socket.emit('user-online', userId); // notify the server that this user is online

    // listen for the active users updates
    socket.on('updateActiveUsers', (activeUsers) => {
      setOnlineUsers(activeUsers);
    });

    return () => {
      socket.disconnect();
    }
  }, [userId]); */




  // function to update the recent messages

  // const updateRecentMessages = useCallback(
  //   (newMessages) => {
  //     setRecentMessages((prevMessages) => {
  //       const updatedMessages = { ...prevMessages };
  //       newMessages.forEach((message) => {
  //         const senderID = message.senderId.toString();
  //         const receiverID = message.receiverId.toString(); // userId = receiverId
  //         const otherUserID =
  //           senderID === loggedInUser._id.toString() ? receiverID : senderID;
  //         // const isSeen = message.seen || false;
  //         const isSeen = message.status === 'seen';

  //         // Determine the display message based on the messageType
  //         let displayMessage;
  //         if (message.messageType === 'text') {
  //           // we call message.message not message.content because in server-side, 
  //           // we save the content and file both on 'message' while sending the message to the client
  //           const messageContent = message.message || "";
  //           console.log("message::::", message);
  //           console.log("messageContent::::", messageContent);
  //           displayMessage =
  //             senderID === loggedInUser._id.toString()
  //               ? `You: ${messageContent}`
  //               : messageContent;
  //         } else {
  //           const messageTypeMap = {
  //             "photo": 'a photo',
  //             "video": 'a video',
  //             "file": 'a file',
  //             "audio": 'an audio',
  //           };
  //           const messageTypeText = messageTypeMap[message.messageType];
  //           displayMessage =
  //             senderID === loggedInUser._id.toString()
  //               ? `You sent ${messageTypeText}`
  //               : `Sent you ${messageTypeText}`;
  //         }

  //         // Calculate unread count (only for messages received by current user)
  //         let newUnreadCount = prevMessages[otherUserID]?.unreadCount || 0;
  //        if (receiverID === loggedInUser._id.toString() && !isSeen) {
  //           newUnreadCount += 1; // Increment for unseen received messages
  //         } else if (isSeen) {
  //           newUnreadCount = 0; // Reset if seen
  //         } else if (senderID === loggedInUser._id.toString()) {
  //           newUnreadCount = 0; // No unread count for sent messages
  //         }

  //         updatedMessages[otherUserID] = {
  //           message: displayMessage,
  //           timestamp: new Date(message.lastMessageTimestamp).getTime(),
  //           seen: senderID === loggedInUser._id.toString() ? true : isSeen,
  //           unreadCount: newUnreadCount,
  //           lastMessageId: message._id,
  //         };
  //         // updatedMessages[message.userId] = displayMessage;
  //       });
  //       return updatedMessages;
  //     });
  //   },
  //   [loggedInUser?._id]
  // );


  /* 
    // useEffect(() => {
    //   if (loggedInUser) {
    //     const fetchRecentMessages = async () => {
    //       try {
    //         const accessToken = localStorage.getItem("accessToken");
    //         const response = await api.get("/api/messages/recent-messages", {
    //           headers: {
    //             Authorization: `Bearer ${accessToken}`,
    //           },
    //         });
  
    //         updateRecentMessages(response.data.recentMessages);
    //       } catch (error) {
    //         console.error(`Error fetching recent messages: ${error}`);
    //       }
    //     };
    //     fetchRecentMessages();
    //   }
    // }, [loggedInUser, updateRecentMessages]);
  
  
    // // useEffect for the socket events
    // useEffect(() => {
    //   const handleNewMessage = (message) => {
    //     updateRecentMessages([message]);
    //   };
    //   // listen for new messages
    //   socket.on("new_message", handleNewMessage);
    //   // clean up the socket listener whe the component unmounts
    //   return () => {
    //     socket.off("new_message", handleNewMessage);
    //   };
    // }, [updateRecentMessages]);
  
  
    // // Update reentMessages when messages are seen
    // useEffect(() => {
    //   const handleMessageStatus = (data) => {
    //     if (data.status === "seen" && data.messageIds) {
    //       setRecentMessages((prevMessages) => {
    //         const updatedMessages = { ...prevMessages };
    //         Object.keys(updatedMessages).forEach((userId) => {
    //           if (data.messageIds.includes(updatedMessages[userId]?.lastMessageId) &&
    //             updatedMessages[userId]?.seen === false) {
    //             updatedMessages[userId] = {
    //               ...updatedMessages[userId],
    //               seen: true,
    //               unreadCount: 0, // reset unread count when messages are seen
    //             };
    //           }
    //         });
    //         return updatedMessages;
    //       });
    //     }
    //   };
  
    //   socket.on("message-seen", handleMessageStatus);
    //   return () => {
    //     socket.off("message-seen", handleMessageStatus);
    //   };
    // }, [])

  */