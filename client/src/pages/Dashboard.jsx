import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useAuth} from "@clerk/clerk-react";
import {useContext, useEffect, useState} from "react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import {Loader2} from "lucide-react";
import DashboardUpload from "../components/DashboardUpload.jsx";
import RecentFiles from "../components/RecentFiles.jsx";
import {useNavigate} from "react-router-dom";
import {toast} from "react-hot-toast";

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [uploadFiles, setUploadFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [remainingUploads, setRemainingUploads] = useState(5);
    const {getToken} = useAuth();
    const { fetchUserCredits } = useContext(UserCreditsContext);
    const navigate = useNavigate();
    const MAX_FILES = 10;

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
            toast.error("Please select files to upload.");
            return;
        }

        setUploading(true);
        const token = await getToken();

        const uploadPromises = uploadFiles.map(async (file) => {
            try {
                // 1. Get presigned URL
                const presignedResponse = await axios.post(
                    apiEndpoints.GET_PRESIGNED_URL,
                    { fileName: file.name, fileType: file.type },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { url, fields, s3Key } = presignedResponse.data;

                // 2. Upload file to S3
                const formData = new FormData();
                Object.entries(fields).forEach(([key, value]) => {
                    formData.append(key, value);
                });
                formData.append("file", file);

                await axios.post(url, formData);

                // 3. Register file with backend
                const registerResponse = await axios.post(
                    apiEndpoints.REGISTER_FILE,
                    {
                        s3Key,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                return registerResponse.data;

            } catch (err) {
                console.error("Upload failed for file:", file.name, err);
                toast.error(`Upload failed for ${file.name}`);
                return null;
            }
        });

        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter(r => r);

        setUploading(false);
        setUploadFiles([]); // Clear files after upload

        if (successfulUploads.length > 0) {
            await fetchUserCredits(); // Refresh credits
            toast.success(`${successfulUploads.length} file(s) uploaded successfully!`);
            
            // Refresh the recent files list
            const token = await getToken();
            const res = await axios.get(apiEndpoints.FETCH_FILES, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (Array.isArray(res.data)) {
                const sortedFiles = res.data.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);
                setFiles(sortedFiles);
            }
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