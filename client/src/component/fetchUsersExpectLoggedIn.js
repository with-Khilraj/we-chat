// import api from "../Api";

// const fetchUserExceptCurrent = async (accessToken) => {
//   try {
//     const response = await api.get('/api/users/all', {
//       headers: {
//         "Authorization": `Bearer ${accessToken}`,
//       },
//     });
//     return response.data.users;
//   } catch (error) {
//     console.error("Error fetching user data:", error);
//     throw error; // You can throw the error to handle it in the component
//   }
// };

// export default fetchUserExceptCurrent;