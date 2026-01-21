import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
export default socket;


// import { useEffect, useRef, useCallback } from "react";
// import io from "socket.io-client";

// let socketInstance = null;

// export const useSocket = (userId) => {
//   const socketRef = useRef(socketInstance);

//   useEffect(() => {
//     if (!socketRef.current) {
//       socketRef.current = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000");
//       socketInstance = socketRef.current;
//     }

//     if (userId) {
//       socketRef.current.emit("online-user", userId);
//     }

//     return () => {
//       // Optionally disconnect if needed
//       // socketRef.current.disconnect();
//     };
//   }, [userId]);

//   const on = useCallback((event, callback) => {
//     socketRef.current.on(event, callback);
//     return () => socketRef.current.off(event, callback);
//   }, []);

//   const emit = useCallback((event, data) => {
//     socketRef.current.emit(event, data);
//   }, []);

//   return { socket: socketRef.current, on, emit };
// };
