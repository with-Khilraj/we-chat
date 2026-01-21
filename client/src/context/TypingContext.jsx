import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../utils/useSocket';

const TypingContext = createContext();

export const useTyping = () => {
    const context = useContext(TypingContext);
    if (!context) {
        throw new Error('useTyping must be used within TypingProvider');
    }
    return context;
};

export const TypingProvider = ({ children }) => {
    // Map of userId -> username for users who are typing
    const [typingUsers, setTypingUsers] = useState(new Map());

    useEffect(() => {
        const handleTyping = (data) => {
            if (data.isTyping && data.username) {
                // Extract userId from roomId (format: userId1-userId2)
                const [user1, user2] = data.roomId.split('-');
                // Determine which user is typing (not the current user)
                const typingUserId = user1; // We'll refine this logic if needed

                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(typingUserId, data.username);
                    return newMap;
                });
            } else {
                // User stopped typing
                const [user1, user2] = data.roomId.split('-');
                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(user1);
                    newMap.delete(user2);
                    return newMap;
                });
            }
        };

        socket.on('typing', handleTyping);

        return () => {
            socket.off('typing', handleTyping);
        };
    }, []);

    return (
        <TypingContext.Provider value={{ typingUsers }}>
            {children}
        </TypingContext.Provider>
    );
};
