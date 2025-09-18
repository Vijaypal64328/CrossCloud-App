import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useContext, useEffect, useState} from "react";
import {useAuth} from "@clerk/clerk-react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import {AlertCircle} from "lucide-react";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import UploadBox from "../components/UploadBox.jsx";


const Upload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); //success or error
    const [uploadProgress, setUploadProgress] = useState(0);
    const [remainingUploads, setRemainingUploads] = useState(10);
    const {getToken} = useAuth();
    const {credits, setCredits, fetchUserCredits} = useContext(UserCreditsContext);
    const MAX_FILES = 10;

    // Calculate remaining uploads
    useEffect(() => {
        setRemainingUploads(MAX_FILES - files.length);
    }, [files]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (files.length + selectedFiles.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of 10 files at once.`);
            setMessageType("error");
            return;
        }
        setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);
        setMessage("");
        setMessageType("");
    }

    const handleRemoveFile = (index) => {
        setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
        setMessageType("");
        setMessage("");
    }

    const handleUpload = async () => {
        if (files.length === 0){
            setMessageType("error");
            setMessage("Please select atleast one file to upload.");
            return;
        }

        if (files.length > MAX_FILES) {
            setMessage(`You can only upload a maximum of ${MAX_FILES} files at once.`);
            setMessageType("error");
            return;
        }

        setUploading(true);
        setMessage("Uploading files...");
        setMessageType("info");
        setUploadProgress(0);

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            const token = await getToken();
            await axios.post(apiEndpoints.UPLOAD_FILE, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
                    setUploadProgress(percentCompleted);
                }
            });

            setUploadProgress(100);
            setMessage("Files uploaded successfully.");
            setMessageType("success");

            await fetchUserCredits();

            setTimeout(() => {
                setFiles([]);
                setUploading(false);
                setUploadProgress(0);
            }, 1500);

        } catch (error) {
            console.error('Error uploading files: ', error);
            setMessage(error.response?.data?.message || "Error uploading files. Please try again.");
            setMessageType("error");
            setUploading(false);
            setUploadProgress(0);
        }
    }

    const isUploadDisabled = files.length === 0 || files.length > MAX_FILES || credits <= 0 || files.length > credits;


    return (
        <DashboardLayout activeMenu="Upload">
            <div className="p-6">
                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${messageType === 'error' ? 'bg-red-50 text-red-700': messageType === 'success' ? 'bg-green-50 text-green-700': 'bg-blue-50 text-blue-700'}`}>
                        {messageType === 'error' && <AlertCircle size={20} />}
                        {message}
                    </div>
                )}

                <UploadBox
                    files={files}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                    uploading={uploading}
                    onRemoveFile={handleRemoveFile}
                    remainingCredits={credits}
                    isUploadDisabled={isUploadDisabled}
                    uploadProgress={uploadProgress}
                    remainingUploads={remainingUploads}
                />
            </div>
        </DashboardLayout>
    )
}

export default Upload;