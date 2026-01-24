import React from 'react';
import { X, Square, Play, Pause, Send } from 'lucide-react';
import '../../../styles/audioRecording.css';

const AudioRecordingBar = ({
    state, // 'recording' | 'stopped' | 'playing'
    duration,
    currentTime,
    onCancel,
    onStop,
    onPlay,
    onPause,
    onSend
}) => {

    // Format time as M:SS
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Get control button based on state
    const renderControlButton = () => {
        if (state === 'recording') {
            return (
                <button
                    onClick={onStop}
                    className="audio-control-btn stop-btn"
                    title="Stop Recording"
                >
                    <Square size={20} fill="currentColor" />
                </button>
            );
        } else if (state === 'stopped') {
            return (
                <button
                    onClick={onPlay}
                    className="audio-control-btn play-btn"
                    title="Play Preview"
                >
                    <Play size={20} fill="currentColor" />
                </button>
            );
        } else if (state === 'playing') {
            return (
                <button
                    onClick={onPause}
                    className="audio-control-btn pause-btn"
                    title="Pause"
                >
                    <Pause size={20} />
                </button>
            );
        }
    };

    return (
        <div className="audio-recording-bar">
            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="audio-cancel-btn"
                title="Cancel Recording"
            >
                <X size={20} />
            </button>

            {/* Control Button (Stop/Play/Pause) */}
            {renderControlButton()}

            {/* Waveform Animation Container */}
            <div className="audio-waveform-container">
                {state === 'recording' && (
                    <div className="waveform-bars">
                        {[...Array(40)].map((_, i) => (
                            <div
                                key={i}
                                className="waveform-bar"
                                style={{
                                    animationDelay: `${i * 0.05}s`,
                                    animationDuration: `${0.6 + Math.random() * 0.4}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                {(state === 'stopped' || state === 'playing') && (
                    <div className="waveform-static">
                        <div className="waveform-progress" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    </div>
                )}

                {/* Timer */}
                <div className="audio-timer">
                    {state === 'playing'
                        ? `${formatTime(currentTime)} / ${formatTime(duration)}`
                        : formatTime(duration)
                    }
                </div>
            </div>

            {/* Send Button */}
            <button
                onClick={onSend}
                disabled={state === 'recording'}
                className="audio-send-btn"
                title="Send Audio"
            >
                <Send size={20} />
            </button>
        </div>
    );
};

export default AudioRecordingBar;
