import { useState, useEffect } from "react";
import { fetchUserData, fetchUserExceptCurrent } from "../services/userService";


export const useUserStore = (accessToken) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        const [profile, allUsers] = await Promise.all([
          fetchUserData(accessToken),
          fetchUserExceptCurrent(accessToken)
        ]);
        setCurrentUser(profile);
        setUsers(allUsers);
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [accessToken]);
  return { currentUser, users, loading };
}
