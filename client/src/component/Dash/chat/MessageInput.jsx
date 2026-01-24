import React from "react";
import { X, Plus, Image, Mic, Send } from "lucide-react";
import AudioRecordingBar from "./AudioRecordingBar";

const MessageInput = ({
    replyingTo,
    currentUser,
    selectedUser,
    cancelReply,
    selectedFiles,
    fileInputRef,
    removeSelectedFile,
    audioRecordingState,
    audioDuration,
    audioCurrentTime,
    cancelAudioRecording,
    stopAudioRecording,
    playAudioPreview,
    pauseAudioPreview,
    sendAudioMessage,
    newMessage,
    handleTypingEvent,
    isUploading,
    handleSendMessage,
    handleFileInputChange,
    startAudioRecording
}) => {
    return (
        <div className="p-4 bg-white border-t border-gray-200">
            {/* Reply Banner */}
            {replyingTo && (
                <div className="reply-banner">
                    <div className="flex justify-between items-center w-full px-4 py-2 bg-gray-50 rounded-t-lg border-b border-gray-200">
                        <div className="flex flex-col">
                            <span className="text-xs text-blue-500 font-semibold">
                                Replying to {replyingTo.senderId === currentUser._id ? "yourself" : selectedUser.username}
                            </span>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                                {replyingTo.messageType === 'text' ? replyingTo.content : `[${replyingTo.messageType}]`}
                            </span>
                        </div>
                        <button onClick={cancelReply} className="text-gray-500 hover:text-gray-700">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Media Staging Preview */}
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-gray-50 rounded-lg border border-gray-100 scrollbar-hide">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                    >
                        <Plus size={24} className="text-gray-600" />
                    </button>
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group shadow-lg">
                            {file.type.startsWith('image') ? (
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-center p-1 break-words text-gray-700">
                                    {file.name.slice(0, 8)}...
                                </div>
                            )}
                            <button
                                onClick={() => removeSelectedFile(index)}
                                className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl p-1 hover:bg-red-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Conditional Rendering: Audio Recording UI or Normal Input */}
            {audioRecordingState !== 'idle' ? (
                <AudioRecordingBar
                    state={audioRecordingState}
                    duration={audioDuration}
                    currentTime={audioCurrentTime}
                    onCancel={cancelAudioRecording}
                    onStop={stopAudioRecording}
                    onPlay={playAudioPreview}
                    onPause={pauseAudioPreview}
                    onSend={sendAudioMessage}
                />
            ) : (
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                    {/* Media Action */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-200 rounded-full transition-colors"
                        title="Upload Media"
                    >
                        <Image size={20} />
                    </button>

                    {/* Audio Action */}
                    <button
                        onClick={startAudioRecording}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-white/5 rounded-full transition-colors"
                        title="Record Audio"
                    >
                        <Mic size={20} />
                    </button>

                    {/* Text Input */}
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTypingEvent}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-500 px-2"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isUploading && (newMessage.trim() || selectedFiles.length > 0)) {
                                handleSendMessage();
                            }
                        }}
                    />

                    {/* Send Button */}
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isUploading || (!newMessage.trim() && selectedFiles.length === 0)}
                        className={`p-2.5 rounded-full transition-colors shadow-lg ${isUploading || (!newMessage.trim() && selectedFiles.length === 0)
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-500 hover:bg-blue-100"
                            }`}
                        title="Send Message"
                    >
                        <Send size={20} />
                    </button>
                </div>
            )}

            {/* Hidden file input for media */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileInputChange}
                multiple
                accept="image/*, video/*, .pdf, .doc, .docx"
            />
        </div>
    );
};

export default MessageInput;
