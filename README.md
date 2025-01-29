# We-Chat

A real-time chat application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) featuring email verification, authentication, and real-time messaging.

## Features

- 🔐 User Authentication
  - Email verification with OTP
  - JWT-based authentication with access and refresh tokens
  - Secure password hashing
  
- 💬 Real-time Messaging
  - One-on-one chat functionality
  - Online/offline status indicators
  - Message timestamps
  - Recent messages preview
  
- 🎨 User Interface
  - Clean and responsive design
  - User-friendly chat interface
  - Search functionality for users
  - Profile management

## Tech Stack

- **Frontend:**
  - React.js
  - Socket.io-client for real-time communication
  - React Router for navigation
  - React Toastify for notifications
  - CSS for styling

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - Socket.io for real-time events
  - JWT for authentication
  - Nodemailer for email services
  - Bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email verification)

### Installation

1. Clone the repository
bash
- git clone https://github.com/yourusername/we-chat.git

# Install dependencies for both client and server at once
bash
- cd we-chat
- npm install (just once outside the client and server folder)

1. create a .env file in the server folder and add the following:
- MONGO_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret
- REFRESH_TOKEN_SECRET=your_refresh_token_secret
- EMAIL_USER=your_gmail@gmail.com
- EMAIL_PASSWORD=your_gmail_app_password (never use your real pass, use generated app pass)


2. Set up Gmail App Password
- Enable 2-Step Verification in your Gmail account
- Generate App Password (Settings → Security → App Passwords)
- Use the generated password in your .env file


### Running the Application

1. Start the backend server
bash
- cd server
- npm start or npm run dev

2. Start the frontend server
bash
- cd client
- npm start



## API Endpoints

### Authentication
- `POST /api/users/signup` - Register new user
- `POST /api/users/verify-otp` - Verify email OTP
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `POST /api/users/refresh-token` - Refresh access token

### Users
- `GET /api/users/profile` - Get logged-in user profile
- `GET /api/users/all` - Get all users except current user
- `PUT /api/users/update` - Update user profile

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:roomId` - Get messages for a chat room

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Socket.io for real-time communication
- MongoDB Atlas for database hosting
- React Toastify for notifications
- Nodemailer for email services

## Contact

Your Name - [Khilraj Shrestha](mailto:khilraj321@gmail.com)
