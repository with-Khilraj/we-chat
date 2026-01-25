import { useEffect, useState } from "react";
import { fetchUserExceptCurrent } from "../services/userService";

export const useUserStore = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const data = await fetchUserExceptCurrent();
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getUsers();
  }, []);

  return { users, loading, error };
};


/* the reson we're not using this hook is that we already have the current user info in AuthContext
and we don't want to fetch it again here to avoid redundant API calls or unnecessary complexity. */

// import { useState, useEffect } from "react";
// import { fetchUserData, fetchUserExceptCurrent } from "../services/userService";

// export const useUserStore = (accessToken) => {
//   const [currentUser, setCurrentUser] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!accessToken) return;

//     const loadUsers = async () => {
//       try {
//         setLoading(true);
//         const [profile, allUsers] = await Promise.all([
//           fetchUserData(accessToken),
//           fetchUserExceptCurrent(accessToken)
//         ]);
//         setCurrentUser(profile);
//         setUsers(allUsers);
//       } catch (error) {
//         console.error("Error loading users:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     loadUsers();
//   }, [accessToken]);
//   return { currentUser, users, loading };
// }
