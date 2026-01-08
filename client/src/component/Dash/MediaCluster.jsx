import React, { useState } from 'react';
import { renderStatusIndicator } from "../../utils/chatUtils";

const MediaCluster = ({ messages, isCurrentUser }) => {
    // If no messages, return null
    if (!messages || messages.length === 0) return null;

    // --- CASE 1: Single Message ---
    // If there's only 1 message, render it normally (full size)
    // Actually, ChatContainer might handle single text messages separately, 
    // but our cluster logic puts single media into a cluster too.
    if (messages.length === 1) {
        const msg = messages[0];
        const isVideo = msg.messageType === 'video';
        return (
            <div className={`message-container ${isCurrentUser ? "sent" : "received"} message-type-${msg.messageType} p-0 overflow-hidden`}>
                <div className="relative">
                    {isVideo ? (
                        <video src={msg.fileUrl} className="max-w-[300px] max-h-[300px] rounded-lg object-cover" controls />
                    ) : (
                        <img src={msg.fileUrl} alt="media" className="max-w-[300px] max-h-[300px] rounded-lg object-cover" />
                    )}
                    {/* Status for single message */}
                    {isCurrentUser && (
                        <div className="absolute bottom-1 right-2 bg-black/40 rounded px-1 flex items-center justify-center">
                            <div className="scale-75 origin-center">
                                {renderStatusIndicator(msg.status)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- CASE 2: 2-3 Messages (Scatter/Fan Layout) ---
    // "Fan" out the cards slightly to show they are a collection
    if (messages.length >= 2 && messages.length <= 3) {
        return (
            <div className="w-[280px] h-[300px] my-2 select-none group cursor-pointer" style={{ position: 'relative', margin: '0' }}>
                {messages.map((msg, index) => {
                    const isVideo = msg.messageType === 'video';
                    // Calculate rotation and position for "fan" effect
                    // 2 items: -5deg, 5deg
                    // 3 items: -10deg, 0deg, 10deg
                    let rotation = 0;
                    let translateX = 0;
                    let translateY = 0;
                    let zIndex = index;

                    if (messages.length === 2) {
                        rotation = index === 0 ? -6 : 6;
                        translateX = index === 0 ? -10 : 10;
                    } else {
                        // 3 items
                        if (index === 0) { rotation = -10; translateX = -15; translateY = 5; }
                        if (index === 1) { rotation = 0; translateX = 0; translateY = -5; zIndex = 10; } // center on top
                        if (index === 2) { rotation = 10; translateX = 15; translateY = 5; }
                    }

                    // Received messages: Align left (closer to avatar) -> Offset 10px
                    // Sent messages: Align right (standard look) -> Offset 50px
                    const baseOffset = isCurrentUser ? 50 : 10;

                    return (
                        <div
                            key={msg._id || msg.tempId}
                            className="absolute top-0 left-0 w-[200px] h-[250px] transition-transform duration-300 ease-out border-4 border-white shadow-lg rounded-xl overflow-hidden bg-gray-100"
                            style={{
                                transform: `translate(${baseOffset + translateX}px, ${20 + translateY}px) rotate(${rotation}deg)`,
                                zIndex: zIndex,
                                margin: '0'
                            }}
                        >
                            {isVideo ? (
                                <video src={msg.fileUrl} className="w-full h-full object-cover" controls={false} /> // No controls in scatter preview
                            ) : (
                                <img src={msg.fileUrl} alt="scatter" className="w-full h-full object-cover" />
                            )}
                            {/* Overlay for not-top items maybe? No, let them be distinct. */}

                            {/* Status on the LAST item (visually top one if applicable, or just last in list) */}
                            {isCurrentUser && index === messages.length - 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1 z-20">
                                    {/* Status needs to be small */}
                                    <div className="scale-75">
                                        {renderStatusIndicator(msg.status)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // --- CASE 3: > 3 Messages (Stacked Deck Layout) ---
    // Pure stack, slight offset, top one fully visible
    if (messages.length > 3) {
        return (
            <div className="w-[280px] h-[320px] my-2 select-none cursor-pointer group" style={{ position: 'relative', margin: '0' }}>
                {messages.map((msg, index) => {
                    // Only render the last 3-4 items to save DOM, or all if needed?
                    // Let's render reverse so last is on top? 
                    // Actually, array order: [0, 1, 2, 3]. 3 is latest.
                    // We want 3 on top.

                    const reverseIndex = messages.length - 1 - index; // 0 for the last item (top)

                    // If it's deep in the stack (> 3 levels down), hide it or pile it
                    if (reverseIndex > 3) return null;

                    const isTop = reverseIndex === 0;
                    const isVideo = msg.messageType === 'video';

                    // Stack effects
                    let rotation = 0;
                    let translateY = 0;
                    let scale = 1;

                    if (!isTop) {
                        // Random-ish but deterministic rotation based on index
                        rotation = (reverseIndex % 2 === 0 ? 1 : -1) * (reverseIndex * 4); // +/- 4, 8, 12 deg
                        translateY = reverseIndex * -8; // Move up slightly
                        scale = 1 - (reverseIndex * 0.05); // Shrink slightly
                    }

                    return (
                        <div
                            key={msg._id || msg.tempId}
                            className="absolute left-1/2 top-1/2 w-[240px] h-[280px] bg-white border-[3px] border-white shadow-xl rounded-2xl overflow-hidden transition-all duration-300"
                            style={{
                                zIndex: index, // Later items (higher index) on top
                                transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                                margin: '0'
                            }}
                        >
                            {isVideo ? (
                                <video src={msg.fileUrl} className="w-full h-full object-cover" />
                            ) : (
                                <img src={msg.fileUrl} alt="stack" className="w-full h-full object-cover" />
                            )}

                            {/* Counter on the top card if there are more hidden */}
                            {isTop && (
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {messages.length} Photos
                                </div>
                            )}

                            {/* Status on Top Card */}
                            {isTop && isCurrentUser && (
                                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1">
                                    <div className="scale-75">
                                        {renderStatusIndicator(msg.status)}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return null;
};

export default MediaCluster;
