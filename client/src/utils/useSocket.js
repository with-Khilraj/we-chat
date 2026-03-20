import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";


// SINGLETON SOCKET INSTANCE - created once outside the hook so alll component share the same connection
const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
});


export { socket };

// Use socket hook
// Manages connectin lifecycle - call once at the app root level
export const useSocket = () => {
    const { currentUser, loading } = useAuth();
    const reconnectHandlerRef = useRef(null);

    // Helper: register presence after any re-connect
    const registerPresence = (userId) => {
        if (userId &&socket.connected) {
            socket.emit('online-user', userId);
        }
    };

    useEffect(() => {
        // wait until auth is resolved before connecting
        if (loading) return;

        // Connect when user is logged in
        if (currentUser?._id) {
            if (!socket.connected) {
                socket.connect();
            }

            // register presence immediately after connect
            const onConnect = () => {
                console.log(`[Socket] Connected:`, socket.id);
                registerPresence(currentUser._id);
            };

            // Re-register presence on every reconnect (network drop recovery)
            const onReconnect = (attemptNumber) => {
                console.log(`[Socket] Reconnected after ${attemptNumber} attempts`)
                registerPresence(currentUser._id);
            };

            // Handle disconnect
            const onDisconnect = (reason) => {
                console.warn(`[Socket] Disconnected: ${reason}`)
            };

            const onReconnectAttempt = (attemptNumber) => {
                console.log(`[Socket] Reconnect attempt: ${attemptNumber}....`)
            };

            const onReconnectFailed = () => {
                console.error(`[Socket] Reconnect failed after all attempts`)
            };

            // Register event listeners
            socket.on('connect', onConnect);
            socket.on('reconnect', onReconnect);
            socket.on('disconnect', onDisconnect);
            socket.on('reconnect_attempt', onReconnectAttempt);
            socket.on('reconnect_failed', onReconnectFailed);

            // =========== Tab-focus reconnect ============
            // when user switches back to this tab, ensure socket is connected
            const onVisibilityChange = () => {
                if (document.visibilityState === "visible") {
                    if (!socket.connected) {
                        console.log(`[Socket] Reconnecting on tab focus...`);
                        socket.connect();
                    } else {
                        // socket already connected - just re-register presence
                        console.log(`[Socket] Tab visible - re-registering presence`);
                        registerPresence(currentUser._id);
                    }
                }
            };

            // =========== Network drop recovery ============
            // Browser fires online when network comes back after a drop
            const onNetworkOnline = () => {
                console.log("[Socket] Network restored --- reconnecting...");
                if (!socket.connected) {
                    socket.connect();
                } else {
                    // socket already connected - just re-register presence
                    console.log(`[Socket] Network restored - re-registering presence`);
                    registerPresence(currentUser._id);
                }
            };

            const onNetworkOffline = () => {
                console.log("[Socket] Network lost ---");
            };

            document.addEventListener('visibilitychange', onVisibilityChange);
            window.addEventListener('online', onNetworkOnline);
            window.addEventListener('offline', onNetworkOffline);

            // store ref for cleanup
            reconnectHandlerRef.current = {
                onVisibilityChange,
                onNetworkOnline,
                onNetworkOffline
            };

            // Cleanup on unmount or when dependencies change
            return () => {
                socket.off('connect', onConnect);
                socket.off('reconnect', onReconnect);
                socket.off('disconnect', onDisconnect);
                socket.off('reconnect_attempt', onReconnectAttempt);
                socket.off('reconnect_failed', onReconnectFailed);
                document.removeEventListener('visibilitychange', onVisibilityChange);
                window.removeEventListener('online', onNetworkOnline);
                window.removeEventListener('offline', onNetworkOffline);
            };
        }

        // Disconnect when user logs out
        if (!currentUser && socket.connected) {
            console.log(`[Socket] Disconnected on user logout`);
            socket.disconnect();
        }
    }, [currentUser, loading]);

    return socket;
}

export default socket;

