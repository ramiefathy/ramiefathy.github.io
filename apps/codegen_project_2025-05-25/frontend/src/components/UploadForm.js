import React, { useState, useRef } from 'react';

const UploadForm = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [errorMessage, setErrorMessage] = useState(''); // State for general error messages
    const fileInputRef = useRef(null);
    const fileIdCounter = useRef(0); // For generating unique IDs for files

    // This function simulates a file upload process with progress updates.
    // In a real application, this would be replaced with actual API calls to the Backend_API_Agent.
    const simulateFileUpload = async (fileEntry) => {
        // --- START: Real Backend_API_Agent Integration Placeholder ---
        // For actual file uploads, you would use FormData and a fetch or axios call.
        // This is where Frontend_Interface_Agent interacts with Backend_API_Agent.
        // Example with fetch and XMLHttpRequest for progress:
        /*
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('pdf', fileEntry.file); // 'pdf' should match backend's expected field name

            const xhr = new XMLHttpRequest();

            // Listen for upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentCompleted = Math.round((event.loaded * 100) / event.total);
                    setUploadedFiles(prevFiles =>
                        prevFiles.map(f =>
                            f.id === fileEntry.id ? { ...f, progress: percentCompleted, status: 'uploading' } : f
                        )
                    );
                }
            };

            // Listen for load (success)
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({ success: true, response: JSON.parse(xhr.responseText) });
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status} - ${xhr.statusText}`));
                }
            };

            // Listen for errors
            xhr.onerror = () => {
                reject(new Error('Network error or server unreachable.'));
            };

            // Open and send the request
            xhr.open('POST', '/api/upload-pdf'); // This endpoint would be managed by Backend_API_Agent
            xhr.send(formData);
        });
        */
        // --- END: Real Backend_API_Agent Integration Placeholder ---

        // Current implementation: Simulate asynchronous upload with random progress and outcome
        return new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 10) + 5; // Simulate progress increments
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    // Simulate success or failure
                    if (Math.random() > 0.1) { // 90% chance of success
                        resolve({ success: true });
                    } else { // 10% chance of failure
                        resolve({ success: false, error: 'Simulated network error' });
                    }
                }
                // Update specific file progress
                setUploadedFiles(prevFiles =>
                    prevFiles.map(f =>
                        f.id === fileEntry.id ? { ...f, progress: progress, status: 'uploading' } : f
                    )
                );
            }, 200);
        });
    };

    const handleFiles = (files) => {
        setErrorMessage(''); // Clear any previous error message

        const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        const nonPdfFiles = Array.from(files).filter(file => file.type !== 'application/pdf');

        if (nonPdfFiles.length > 0) {
            setErrorMessage("Only PDF files are accepted. Some selected files were ignored.");
        }

        const newFiles = pdfFiles.map(file => ({
            id: fileIdCounter.current++, // Use ref for unique ID
            file: file,
            name: file.name,
            progress: 0,
            status: 'pending', // 'pending', 'uploading', 'completed', 'failed'
            message: ''
        }));

        if (newFiles.length === 0 && files.length > 0) {
             // If original selection had files but none were PDFs
             setErrorMessage("No PDF files were selected. Please select valid PDF documents.");
             return;
        }


        setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);

        // Automatically start upload for new valid files
        newFiles.forEach(async (fileEntry) => {
            setUploadedFiles(prevFiles =>
                prevFiles.map(f =>
                    f.id === fileEntry.id ? { ...f, status: 'uploading' } : f
                )
            );
            const result = await simulateFileUpload(fileEntry);
            setUploadedFiles(prevFiles =>
                prevFiles.map(f =>
                    f.id === fileEntry.id ? {
                        ...f,
                        progress: 100,
                        status: result.success ? 'completed' : 'failed',
                        message: result.success ? 'Upload successful!' : `Upload failed: ${result.error}`
                    } : f
                )
            );
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFiles = e.dataTransfer.files;
        handleFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = e.target.files;
        handleFiles(selectedFiles);
        e.target.value = null; // Clear the input so same file can be selected again
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleRemoveFile = (id) => {
        setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== id));
    };

    return (
        <div style={styles.container}>
            <h2>Upload PDF Documents</h2>
            <p style={styles.description}>
                Upload one or more dermatology-related PDF documents. The system will extract and process information.
            </p>

            <div
                style={{
                    ...styles.dropZone,
                    borderColor: isDragOver ? '#007bff' : '#ccc',
                    backgroundColor: isDragOver ? '#f0f8ff' : '#fff'
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
            >
                <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />
                <p>Drag & Drop PDFs here, or click to select files</p>
                <p style={{ fontSize: '0.9em', color: '#666' }}>(.pdf only)</p>
            </div>

            {errorMessage && (
                <p style={styles.errorMessage}>{errorMessage}</p>
            )}

            {uploadedFiles.length > 0 && (
                <div style={styles.fileList}>
                    <h3>Upload Status:</h3>
                    {uploadedFiles.map(fileEntry => (
                        <div key={fileEntry.id} style={styles.fileItem}>
                            <div style={styles.fileHeader}>
                                <span style={styles.fileName}>{fileEntry.name}</span>
                                <button
                                    onClick={() => handleRemoveFile(fileEntry.id)}
                                    style={styles.removeButton}
                                    title="Remove file"
                                >
                                    &times;
                                </button>
                            </div>
                            <div style={styles.progressBarContainer}>
                                <div
                                    style={{
                                        ...styles.progressBarFill,
                                        width: `${fileEntry.progress}%`,
                                        backgroundColor: fileEntry.status === 'completed' ? '#28a745' :
                                                         fileEntry.status === 'failed' ? '#dc3545' : '#007bff'
                                    }}
                                ></div>
                                <span style={styles.progressText}>
                                    {fileEntry.status === 'pending' ? 'Pending...' :
                                     fileEntry.status === 'uploading' ? `${fileEntry.progress}%` :
                                     fileEntry.status === 'completed' ? 'Completed' :
                                     fileEntry.status === 'failed' ? 'Failed' : ''}
                                </span>
                            </div>
                            {fileEntry.message && (
                                <p style={{
                                    ...styles.fileMessage,
                                    color: fileEntry.status === 'failed' ? '#dc3545' : '#28a745'
                                }}>
                                    {fileEntry.message}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        maxWidth: '800px',
        margin: '20px auto',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba[0,0,0,0.1]', // Corrected syntax
        backgroundColor: '#f9f9f9',
    },
    description: {
        fontSize: '1em',
        color: '#555',
        marginBottom: '20px',
    },
    dropZone: {
        border: '2px dashed #ccc',
        borderRadius: '5px',
        padding: '40px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        color: '#666',
        fontSize: '1.1em',
        marginBottom: '20px',
    },
    errorMessage: {
        color: '#dc3545',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '5px',
        padding: '10px',
        marginBottom: '20px',
        textAlign: 'center',
    },
    fileList: {
        marginTop: '30px',
        borderTop: '1px solid #eee',
        paddingTop: '20px',
    },
    fileItem: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '15px',
        padding: '10px',
        border: '1px solid #e9e9e9',
        borderRadius: '5px',
        backgroundColor: '#fff',
    },
    fileHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '5px',
    },
    fileName: {
        fontWeight: 'bold',
        color: '#333',
        flexGrow: 1, // Allows file name to take up available space
        marginRight: '10px', // Spacing before remove button
    },
    removeButton: {
        background: 'none',
        border: 'none',
        color: '#dc3545',
        fontSize: '1.2em',
        cursor: 'pointer',
        padding: '0 5px',
        lineHeight: 1,
        transition: 'color 0.2s ease',
    },
    progressBarContainer: {
        width: '100%',
        backgroundColor: '#e0e0e0',
        borderRadius: '5px',
        height: '20px',
        overflow: 'hidden',
        position: 'relative',
    },
    progressBarFill: {
        height: '100%',
        transition: 'width 0.2s ease-in-out',
        borderRadius: '5px',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    progressText: {
        position: 'absolute',
        width: '100%',
        textAlign: 'center',
        lineHeight: '20px',
        color: '#333',
        fontSize: '0.85em',
        zIndex: 1,
    },
    fileMessage: {
        fontSize: '0.9em',
        marginTop: '5px',
        fontWeight: 'bold',
    }
};

export default UploadForm;