import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useContext, useState, useCallback} from "react";
import {useAuth} from "@clerk/clerk-react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import {AlertCircle} from "lucide-react";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import UploadBox from "../components/UploadBox.jsx";
import {useDropzone} from "react-dropzone";
import {toast} from "react-toastify";


const Upload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); //success or error
    const [isUploading, setIsUploading] = useState(false);
    const { getToken } = useAuth();
    const { fetchUserCredits } = useContext(UserCreditsContext);
    const MAX_FILES = 10;

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

        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));

        try {
            const token = await getToken();
            const response = await axios.post(apiEndpoints.UPLOAD_FILE, formData, {headers: {"Content-Type": "multipart/form-data", Authorization: `Bearer ${token}`}});

            if (response.data && response.data.remainingCredits !== undefined) {
                setCredits(response.data.remainingCredits);
            }

            // Always refresh credits from backend after upload
            await fetchUserCredits();

            setMessage("Files uploaded successfully.");
            setMessageType("success");
            setFiles([]);
        }catch(error) {
            console.error('Error uploading files: ', error);
            setMessage(error.response?.data?.message || "Error uploading files. Please try again.");
            setMessageType("error");
        }finally {
            setUploading(false);
        }
    }

    const onDrop = useCallback(
        async (acceptedFiles) => {
            const token = await getToken();
            if (!token) {
                toast.error("You must be logged in to upload files.");
                return;
            }

            setIsUploading(true);
            const uploadPromises = acceptedFiles.map(async (file) => {
                try {
                    // 1. Get presigned URL from our server
                    const presignedUrlResponse = await axios.post(
                        apiEndpoints.PRESIGNED_URL_UPLOAD,
                        { fileName: file.name, fileType: file.type },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const { url, key } = presignedUrlResponse.data;

                    // 2. Upload file directly to S3
                    await axios.put(url, file, {
                        headers: { "Content-Type": file.type },
                    });

                    // 3. Return metadata for confirmation
                    return {
                        key,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                    };
                } catch (err) {
                    console.error(`Upload failed for ${file.name}:`, err);
                    toast.error(`Upload failed for ${file.name}.`);
                    return null;
                }
            });

            const uploadedFilesMetadata = (await Promise.all(uploadPromises)).filter(Boolean);

            if (uploadedFilesMetadata.length > 0) {
                try {
                    // 4. Confirm uploads with our server
                    await axios.post(
                        apiEndpoints.CONFIRM_UPLOAD,
                        { files: uploadedFilesMetadata },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    toast.success(`${uploadedFilesMetadata.length} file(s) uploaded successfully!`);
                    fetchUserCredits(); // Refresh credits
                } catch (err) {
                    console.error("Error confirming upload:", err);
                    toast.error("Failed to save file metadata.");
                }
            }

            setIsUploading(false);
        },
        [getToken, fetchUserCredits]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        noClick: true,
        noKeyboard: true,
        accept: {'image/*': [], 'video/*': []},
        maxFiles: MAX_FILES,
        onDropRejected: (fileRejections) => {
            fileRejections.forEach(({ file, errors }) => {
                errors.forEach((e) => {
                    if (e.code === "file-too-large") {
                        setMessage(`File ${file.name} is too large. Maximum size is ${e.maxSize / 1024 / 1024}MB.`);
                    } else {
                        setMessage(`File ${file.name} cannot be uploaded. ${e.message}`);
                    }
                    setMessageType("error");
                });
            });
        }
    });

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
                    {...getRootProps()}
                >
                    <input {...getInputProps()} />
                    {
                        isDragActive ?
                            <p>Drop the files here ...</p> :
                            <p>Drag 'n' drop some files here, or click to select files</p>
                    }
                </UploadBox>
            </div>
        </DashboardLayout>
    )
}

export default Upload;