import { useState, useMemo, useEffect } from "react";
import { useUserStore } from "./useUserStore";
import { useRecentMessages } from "./useRecentMessages";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { debounce } from "lodash";

export const useSidebarData = (currentUser, activeTab, activeChatId) => {
    const { users: otherUsers, loading } = useUserStore();
    const { recentMessages } = useRecentMessages(currentUser);
    const onlineUsers = useOnlineUsers();

    const [search, setSearch] = useState("");

    // Debounced search setter
    const setSearchDebounced = useMemo(
        () => debounce((value) => setSearch(value), 300),
        []
    );

    useEffect(() => {
        return () => setSearchDebounced.cancel();
    }, [setSearchDebounced]);

    // Filter and sort users
    const filteredUsers = useMemo(() => {
        if (!otherUsers) return [];

        let filtered = otherUsers.filter((user) => user.isEmailVerified);

        // If in 'chats' tab, show users with messages OR the currently active chat partner
        if (activeTab === 'chats') {
            filtered = filtered.filter((user) =>
                recentMessages[user._id] || user._id === activeChatId
            );
        }
        // If in 'contacts' tab, show only users who haven't messaged yet AND are not current chat partner
        else if (activeTab === 'contacts') {
            filtered = filtered.filter((user) =>
                !recentMessages[user._id] && user._id !== activeChatId
            );
        }

        return filtered
            .filter((user) =>
                user.username.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => {
                const timeA = recentMessages[a._id]?.timestamp || 0;
                const timeB = recentMessages[b._id]?.timestamp || 0;
                return new Date(timeB) - new Date(timeA);
            });
    }, [otherUsers, search, recentMessages, activeTab]);

    return {
        users: filteredUsers,
        loading,
        recentMessages,
        onlineUsers,
        search,
        setSearch: setSearchDebounced,
    };
};
