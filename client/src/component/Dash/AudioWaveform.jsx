import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';
import '../../styles/audioWaveform.css';

const AudioWaveform = ({ audioUrl, isCurrentUser }) => {
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState('0:00');
    const [currentTime, setCurrentTime] = useState('0:00');
    const [isReady, setIsReady] = useState(false);

    // Helper to safely destroy WaveSurfer
    const safeDestroy = (ws) => {
        if (ws && !ws.isDestroyed) {
            try {
                ws.destroy();
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error destroying wavesurfer:', err);
                }
            }
        }
    };

    useEffect(() => {
        if (!waveformRef.current || !audioUrl) return;

        safeDestroy(wavesurfer.current);

        wavesurfer.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: isCurrentUser ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 132, 255, 0.5)',
            progressColor: isCurrentUser ? '#fff' : '#0084ff',
            cursorColor: 'transparent',
            barWidth: 2,
            barRadius: 3,
            responsive: true,
            height: 40,
            normalize: true,
            backend: 'WebAudio',
        });

        wavesurfer.current.on('ready', () => {
            setIsReady(true);
            setDuration(formatTime(wavesurfer.current.getDuration()));
        });

        // Throttle audioprocess updates
        let lastUpdate = 0;
        wavesurfer.current.on('audioprocess', () => {
            const now = Date.now();
            if (now - lastUpdate > 200) { // update every 200ms
                setCurrentTime(formatTime(wavesurfer.current.getCurrentTime()));
                lastUpdate = now;
            }
        });

        wavesurfer.current.on('finish', () => {
            setIsPlaying(false);
            setCurrentTime('0:00');
        });

        wavesurfer.current.on('error', (error) => {
            console.error('WaveSurfer error:', error);
        });

        wavesurfer.current.load(audioUrl);

        return () => {
            safeDestroy(wavesurfer.current);
        };
    }, [audioUrl, isCurrentUser]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = () => {
        if (wavesurfer.current && isReady) {
            wavesurfer.current.playPause();
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={`audio-waveform-container ${isCurrentUser ? 'sent' : 'received'}`}>
            <button className="waveform-play-button" onClick={handlePlayPause} disabled={!isReady}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="waveform-content">
                <div ref={waveformRef} className="waveform" />
                <div className="waveform-time">
                    <span>{currentTime}</span>
                    <span>{duration}</span>
                </div>
            </div>
        </div>
    );
};

export default AudioWaveform;
