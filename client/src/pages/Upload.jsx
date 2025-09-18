import DashboardLayout from "../layout/DashboardLayout.jsx";
import {useContext, useState, useCallback} from "react";
import {useAuth} from "@clerk/clerk-react";
import {UserCreditsContext} from "../context/UserCreditsContext.jsx";
import {AlertCircle} from "lucide-react";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import UploadBox from "../components/UploadBox.jsx";


const Upload = () => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); //success or error
  const {getToken} = useAuth();
  const {credits, setCredits, fetchUserCredits} = useContext(UserCreditsContext);
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

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        progress: 0,
        status: "pending",
      })
    );
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload.");
      return;
    }
    setIsUploading(true);
    const token = await getToken();

    const uploadPromises = files.map(async (file, index) => {
      try {
        // 1. Get presigned URL from the server
        const presignedResponse = await axios.post(
          apiEndpoints.GET_PRESIGNED_URL,
          { fileName: file.name, fileType: file.type },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { url, fields, s3Key } = presignedResponse.data;

        // 2. Upload file directly to S3 using the presigned URL
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("file", file);

        await axios.post(url, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            updateFileProgress(index, progress);
          },
        });

        // 3. Register the file with our backend
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
        
        updateFileStatus(index, "success");
        return registerResponse.data;

      } catch (err) {
        console.error("Upload failed for file:", file.name, err);
        updateFileStatus(index, "error");
        toast.error(`Upload failed for ${file.name}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(r => r);

    if (successfulUploads.length > 0) {
        await fetchCredits(); // Refresh credits after successful uploads
        toast.success(`${successfulUploads.length} file(s) uploaded successfully!`);
    }
    
    setIsUploading(false);
    setFiles([]); // Clear files after upload
    navigate("/my-files");
  };

  const updateFileProgress = (index, progress) => {
    setFiles((prevFiles) =>
      prevFiles.map((f, i) => (i === index ? { ...f, progress } : f))
    );
  };

  const updateFileStatus = (index, status) => {
    setFiles((prevFiles) =>
      prevFiles.map((f, i) => (i === index ? { ...f, status } : f))
    );
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

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
          uploading={isUploading}
          onRemoveFile={handleRemoveFile}
          remainingCredits={credits}
          isUploadDisabled={isUploadDisabled}
        />

        <div className="mt-8">
          <button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-900 disabled:bg-gray-400 transition-colors"
          >
            {isUploading ? "Uploading..." : `Upload ${files.length} File(s)`}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;