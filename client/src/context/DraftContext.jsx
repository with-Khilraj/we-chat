import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

const DraftContext = createContext();

export const useDrafts = () => {
    const context = useContext(DraftContext);
    if (!context) {
        throw new Error('useDrafts must be used within a DraftProvider');
    }
    return context;
};

export const DraftProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [userDrafts, setUserDrafts] = useState({});

    const loadDrafts = useCallback(() => {
        if (!currentUser) {
            setUserDrafts({});
            return;
        }

        const drafts = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('draft_')) {
                const roomId = key.replace('draft_', '');
                const [user1, user2] = roomId.split('-');
                const otherUserId = user1 === currentUser._id ? user2 : user1;
                const draftMessage = localStorage.getItem(key);

                if (draftMessage && draftMessage.trim()) {
                    drafts[otherUserId] = draftMessage;
                }
            }
        }

        // Stabilize state by only updating if content actually changed
        setUserDrafts(prev => {
            const isDifferent = JSON.stringify(prev) !== JSON.stringify(drafts);
            return isDifferent ? drafts : prev;
        });
    }, [currentUser]);

    const updateDraft = useCallback((roomId, content) => {
        const draftKey = `draft_${roomId}`;
        if (content && content.trim()) {
            localStorage.setItem(draftKey, content);
        } else {
            localStorage.removeItem(draftKey);
        }
        loadDrafts();
    }, [loadDrafts]);

    const clearDraft = useCallback((roomId) => {
        const draftKey = `draft_${roomId}`;
        localStorage.removeItem(draftKey);
        loadDrafts();
    }, [loadDrafts]);

    useEffect(() => {
        loadDrafts();
        const handleStorageChange = (e) => {
            if (e.key && e.key.startsWith('draft_')) {
                loadDrafts();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        const interval = setInterval(loadDrafts, 2000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [loadDrafts]);

    const contextValue = useMemo(() => ({
        userDrafts,
        updateDraft,
        clearDraft,
        reloadDrafts: loadDrafts
    }), [userDrafts, updateDraft, clearDraft, loadDrafts]);

    return (
        <DraftContext.Provider value={contextValue}>
            {children}
        </DraftContext.Provider>
    );
};
