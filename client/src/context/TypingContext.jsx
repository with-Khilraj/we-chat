import React, { createContext, useContext, useState, useEffect } from 'react';
import socket from '../utils/useSocket';
import { useAuth } from './AuthContext';

const TypingContext = createContext();

export const useTyping = () => {
    const context = useContext(TypingContext);
    if (!context) {
        throw new Error('useTyping must be used within TypingProvider');
    }
    return context;
};

export const TypingProvider = ({ children }) => {
    const { currentUser } = useAuth();
    // Map of userId -> { username, timestamp }
    const [typingUsers, setTypingUsers] = useState(new Map());

    useEffect(() => {
        if (!currentUser) return;

        const handleTyping = (data) => {
            if (data.isTyping && data.username && data.roomId) {
                // Extract possible userIds from roomId (format: userId1-userId2)
                const [u1, u2] = data.roomId.split('-');
                const otherUserId = u1 === currentUser._id ? u2 : u1;

                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.set(otherUserId, {
                        username: data.username,
                        timestamp: Date.now()
                    });
                    return newMap;
                });
            } else if (data.roomId) {
                // User stopped typing
                const [u1, u2] = data.roomId.split('-');
                const otherUserId = u1 === currentUser._id ? u2 : u1;

                setTypingUsers(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(otherUserId);
                    return newMap;
                });
            }
        };

        socket.on('typing', handleTyping);

        return () => {
            socket.off('typing', handleTyping);
        };
    }, [currentUser]);

    return (
        <TypingContext.Provider value={{ typingUsers }}>
            {children}
        </TypingContext.Provider>
    );
};

