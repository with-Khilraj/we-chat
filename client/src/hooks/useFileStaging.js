import { useState, useRef } from 'react';

export const useFileStaging = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            // Reset input value so the same file selection triggers change again if needed
            e.target.value = '';
        }
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleMediaClick = () => {
        fileInputRef.current?.click();
    };

    const clearSelectedFiles = () => {
        setSelectedFiles([]);
    };

    return {
        selectedFiles,
        setSelectedFiles,
        isUploading,
        setIsUploading,
        fileInputRef,
        handleFileInputChange,
        removeSelectedFile,
        handleMediaClick,
        clearSelectedFiles
    };
};
