import React, { useState, useEffect } from "react";
import { fetchUserData } from "../component/userStore";
// import fetchUserData from "../component/util";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const getUserData = async () => {
      try {
        const userData = await fetchUserData(accessToken);
        setUser(userData);
      } catch (error) {
        console.log("Error fetching userData:", error);
        setError(error.message)
      }
    };
    getUserData();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>Profile</h1>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Phone:</strong> {user.phone}
      </p>
    </div>
  );
};

export default Profile;
