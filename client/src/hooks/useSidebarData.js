import { useState, useMemo, useEffect } from "react";
import { useUserStore } from "./useUserStore";
import { useRecentMessages } from "./useRecentMessages";
import { useOnlineUsers } from "../context/onlineUsersContext";
import { debounce } from "lodash";

/**
 * Hook to manage sidebar data: users, recent messages, search, and sorting.
 */
export const useSidebarData = (currentUser, accessToken) => {
    const { users: otherUsers, loading } = useUserStore(accessToken);
    const { recentMessages } = useRecentMessages(currentUser, accessToken);
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

        return otherUsers
            .filter((user) =>
                user.username.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => {
                const timeA = recentMessages[a._id]?.timestamp || 0;
                const timeB = recentMessages[b._id]?.timestamp || 0;
                return new Date(timeB) - new Date(timeA);
            });
    }, [otherUsers, search, recentMessages]);

    return {
        users: filteredUsers,
        loading,
        recentMessages,
        onlineUsers,
        search,
        setSearch: setSearchDebounced,
    };
};
