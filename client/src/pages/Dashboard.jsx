import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useAuth} from "@clerk/clerk-react";
import {useContext, useEffect, useState} from "react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import {Loader2} from "lucide-react";
import DashboardUpload from "../components/DashboardUpload.jsx";
import RecentFiles from "../components/RecentFiles.jsx";

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [remainingUploads, setRemainingUploads] = useState(5);
    const {getToken} = useAuth();
    const { fetchUserCredits } = useContext(UserCreditsContext);
    const MAX_FILES = 10;
    const MAX_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

    useEffect(() => {
        const fetchRecentFiles = async () => {
            setLoading(true);
            try {
                const token = await getToken();
                const res = await axios.get(apiEndpoints.FETCH_FILES, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    }
                });

                // Only sort if res.data is an array
                if (Array.isArray(res.data)) {
                    const sortedFiles = res.data.sort((a, b) =>
                        new Date(b.uploadedAt) - new Date(a.uploadedAt)
                    ).slice(0, 5);
                    setFiles(sortedFiles);
                } else {
                    setFiles([]);
                    console.error("Expected array for recent files, got:", res.data);
                }
            } catch (error) {
                console.error("Error fetching recent files:", error);
                setFiles([]);
            } finally {
                setLoading(false);
            }
        };
        fetchRecentFiles();
    }, [getToken]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);

        // Check for oversized files
        const oversizedFile = selectedFiles.find(file => file.size > MAX_SIZE_BYTES);
        if (oversizedFile) {
            setMessage(`File "${oversizedFile.name}" exceeds the 2GB size limit. Please select a smaller file.`);
            setMessageType('error');
            return;
        }

        // Check if adding these files would exceed the limit
        if (uploadFiles.length + selectedFiles.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of ${MAX_FILES} files at once.`);
            setMessageType('error');
            return;
        }

        // Add the new files to the existing files
        setUploadFiles(prevFiles => [...prevFiles, ...selectedFiles]);
        setMessage('');
        setMessageType('');
    };

    // Remove a file from the upload list
    const handleRemoveFile = (index) => {
        setUploadFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        setMessage('');
        setMessageType('');
    };

    // Calculate remaining uploads
    useEffect(() => {
        setRemainingUploads(MAX_FILES - uploadFiles.length);
    }, [uploadFiles]);

    // Handle file upload
    const handleUpload = async () => {
        if (uploadFiles.length === 0) {
            setMessage('Please select at least one file to upload.');
            setMessageType('error');
            return;
        }

        if (uploadFiles.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of ${MAX_FILES} files at once.`);
            setMessageType('error');
            return;
        }

        setUploading(true);
        setMessage('Uploading files...');
        setMessageType('info');
        setUploadProgress(0);

        const formData = new FormData();
        uploadFiles.forEach(file => formData.append('files', file));

        try {
            const token = await getToken();
            await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadProgress(100);
            setMessage('Files uploaded successfully!');
            setMessageType('success');

            // Refresh the recent files list
            const res = await axios.get(apiEndpoints.FETCH_FILES, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (Array.isArray(res.data)) {
                const sortedFiles = res.data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);
                setFiles(sortedFiles);
            }

            await fetchUserCredits();

            setTimeout(() => {
                setUploadFiles([]);
                setUploading(false);
                setUploadProgress(0);
            }, 1500);

        } catch (error) {
            console.error('Error uploading files:', error);
            setMessage(error.response?.data?.message || 'Error uploading files. Please try again.');
            setMessageType('error');
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <DashboardLayout activeMenu="Dashboard">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">My Drive</h1>
                <p className="text-gray-600 mb-6">Upload, manage, and share your files securely</p>
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                        messageType === 'error' ? 'bg-red-50 text-red-700' :
                            messageType === 'success' ? 'bg-green-50 text-green-700' :
                                'bg-purple-50 text-purple-700'
                    }`}>
                        {message}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-6">
                    {/*Left column*/}
                    <div className="w-full md:w-[40%]">
                        <DashboardUpload
                            files={uploadFiles}
                            onFileChange={handleFileChange}
                            onUpload={handleUpload}
                            uploading={uploading}
                            onRemoveFile={handleRemoveFile}
                            remainingUploads={remainingUploads}
                            uploadProgress={uploadProgress}
                        />
                    </div>

                    {/*right column*/}
                    <div className="w-full md:w-[60%]">
                        {loading ? (
                            <div className="bg-white rounded-lg shadow p-8 flex flex-col items-center justify-center min-h-[300px]">
                                <Loader2 size={40} className="text-purple-500 animate-spin mb-4" />
                                <p className="text-gray-500">Loading your files...</p>
                            </div>
                        ) : (
                            <RecentFiles files={files} />
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Dashboard;