import { FileIcon, Image, Music, Video, FileText } from "lucide-react";
import React from "react";

export const getFileIcon = (fileName) => {
    if (!fileName) return <FileIcon size={24} className="text-gray-500" />;

    const extension = fileName.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return <Image size={24} className="text-purple-500" />;
    }

    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(extension)) {
        return <Video size={24} className="text-blue-500" />;
    }

    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
        return <Music size={24} className="text-green-500" />;
    }

    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension)) {
        return <FileText size={24} className="text-amber-500" />;
    }

    return <FileIcon size={24} className="text-gray-500" />;
};
