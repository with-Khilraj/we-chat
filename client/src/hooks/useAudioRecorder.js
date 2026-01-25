import { useState, useRef, useEffect } from 'react';

export const useAudioRecorder = () => {
    const [audioRecordingState, setAudioRecordingState] = useState('idle'); // 'idle' | 'recording' | 'stopped' | 'playing'
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [audioStream, setAudioStream] = useState(null);
    const [audioMimeType, setAudioMimeType] = useState('');
    const [audioChunks, setAudioChunks] = useState([]);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [error, setError] = useState("");

    const audioPreviewRef = useRef(null);
    const recordingTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
            }
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (audioPreviewRef.current) {
                audioPreviewRef.current.pause();
                audioPreviewRef.current = null;
            }
        };
    }, [audioStream]);

    const startAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : MediaRecorder.isTypeSupported('audio/mp4')
                    ? 'audio/mp4'
                    : MediaRecorder.isTypeSupported('audio/ogg')
                        ? 'audio/ogg'
                        : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

            setAudioStream(stream);
            setMediaRecorder(recorder);
            setAudioChunks([]);
            setAudioDuration(0);
            setAudioMimeType(mimeType || recorder.mimeType);
            setAudioRecordingState('recording');

            const startTime = Date.now();
            recordingTimerRef.current = setInterval(() => {
                setAudioDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 100);

            recorder.ondataavailable = (e) => {
                setAudioChunks((prev) => [...prev, e.data]);
            };

            recorder.onstop = () => {
                setAudioChunks((latestChunks) => {
                    const blob = new Blob(latestChunks, { type: mimeType || recorder.mimeType });
                    setAudioBlob(blob);
                    return latestChunks;
                });

                if (recordingTimerRef.current) {
                    clearInterval(recordingTimerRef.current);
                    recordingTimerRef.current = null;
                }

                if (audioStream) {
                    audioStream.getTracks().forEach(track => track.stop());
                }
            };

            recorder.start();
        } catch (err) {
            setError('Failed to start recording. Please check microphone permissions.');
            console.error('Error starting audio recording:', err);
        }
    };

    const stopAudioRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setAudioRecordingState('stopped');
        }
    };

    const cancelAudioRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }

        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }

        setAudioRecordingState('idle');
        setAudioBlob(null);
        setAudioDuration(0);
        setAudioCurrentTime(0);
        setAudioChunks([]);
        setMediaRecorder(null);
        setAudioStream(null);
    };

    const playAudioPreview = () => {
        if (!audioBlob) return;

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioPreviewRef.current = audio;

        audio.ontimeupdate = () => {
            setAudioCurrentTime(Math.floor(audio.currentTime));
        };

        audio.onended = () => {
            setAudioRecordingState('stopped');
            setAudioCurrentTime(0);
        };

        audio.play();
        setAudioRecordingState('playing');
    };

    const pauseAudioPreview = () => {
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            setAudioRecordingState('stopped');
        }
    };

    return {
        audioRecordingState,
        audioBlob,
        audioDuration,
        audioCurrentTime,
        audioError: error,
        startAudioRecording,
        stopAudioRecording,
        cancelAudioRecording,
        playAudioPreview,
        pauseAudioPreview,
        setAudioRecordingState,
        setAudioBlob // Needed for resetting after send
    };
};
