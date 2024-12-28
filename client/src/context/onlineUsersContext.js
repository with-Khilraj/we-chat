import React, { createContext, useState, useEffect, useContext } from "react";
import socket from "../component/socket.js";

const OnlineUsersContext = createContext();

export const OnlineUsersProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on('onlineUsers', handleOnlineUsers);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
    };
  }, []);


  // useEffect(() => {
  //   const handleUserStatusChanged = ({ userId, isOnline }) => {
  //     setOnlineUsers((prevOnlineUsers) => {
  //       if (isOnline) {
  //         return [...new Set([...prevOnlineUsers, userId])];
  //       } else {
  //         return prevOnlineUsers.filter((id) => id !== userId);
  //       }
  //     });
  //   };

  //   socket.on('userStatusChanged', handleUserStatusChanged);

  //   return () => {
  //     socket.off('userStatusChanged', handleUserStatusChanged);
  //   };
  // }, []);

  return (
    <OnlineUsersContext.Provider value={(onlineUsers)}>
      {children } 
    </OnlineUsersContext.Provider>
  );
};

export const useOnlineUsers = () => useContext(OnlineUsersContext);