"use client";
import React, { useRef, useState, useEffect } from 'react';
import { useId } from '../../hooks';
import { Flex } from '../Flex';
import { Typography } from '../Typography';
import { Button } from '../Button';
import {
  FiUploadCloud,
  FiFile,
  FiImage,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';
import './FileUpload.css';

export interface FileItem {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  previewUrl?: string;
  error?: string;
}

export interface FileUploadProps {
  /**
   * Label text displayed above the dropzone
   */
  label?: string;
  /**
   * Helper text displayed below the dropzone
   */
  helperText?: string;
  /**
   * Error message - when provided, dropzone is shown in error state
   */
  error?: string;
  /**
   * Accepted file types (e.g., "image/*, .pdf")
   */
  accept?: string;
  /**
   * Allow multiple file selection
   * @default false
   */
  multiple?: boolean;
  /**
   * Maximum file size in bytes
   */
  maxSize?: number;
  /**
   * Callback fired when files are added/uploaded
   */
  onUpload?: (files: FileItem[]) => void;
  /**
   * Callback fired when a file is removed
   */
  onRemove?: (fileId: string) => void;
  /**
   * Custom icon mapping for file extensions
   * @example { 'pdf': <PdfIcon />, 'docx': <DocIcon /> }
   */
  customIcons?: Record<string, React.ReactNode>;
  /**
   * Disable the dropzone
   * @default false
   */
  disabled?: boolean;
  /**
   * Required field indicator
   * @default false
   */
  required?: boolean;
  /**
   * Custom class name for the wrapper
   */
  className?: string;
  /**
   * Initial files to populate the list
   */
  initialFiles?: FileItem[];
}

/**
 * FileUpload component - Drag & drop file upload with previews and progress
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  helperText,
  error,
  accept,
  multiple = false,
  maxSize,
  onUpload,
  onRemove,
  customIcons,
  disabled = false,
  required = false,
  className = '',
  initialFiles = []
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const id = useId('fileupload');

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)}`;
    }
    // Basic extension check if accept is provided (simple check, browser handles input accept)
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      const isValid = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType);
        }
        if (type.startsWith('.')) {
          return fileName.endsWith(type.toLowerCase());
        }
        return fileType === type;
      });

      if (!isValid) {
        return `File type not accepted`;
      }
    }
    return null;
  };

  const processFiles = (newFiles: File[]) => {
    const newFileItems: FileItem[] = newFiles.map(file => {
      const errorMsg = validateFile(file);
      const isImage = file.type.startsWith('image/');

      return {
        id: Math.random().toString(36).substring(7),
        file,
        status: errorMsg ? 'error' : 'uploading',
        progress: 0,
        error: errorMsg || undefined,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined
      };
    });

    // If not multiple, replace existing files
    const updatedFiles = multiple ? [...files, ...newFileItems] : newFileItems;
    setFiles(updatedFiles);

    // Trigger upload simulation for valid files
    newFileItems.forEach(item => {
      if (item.status !== 'error') {
        simulateUpload(item.id);
      }
    });

    if (onUpload) {
      onUpload(updatedFiles);
    }
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, status: 'success', progress: 100 } : f
          )
        );
      } else {
        setFiles(prev =>
          prev.map(f =>
            f.id === fileId ? { ...f, progress } : f
          )
        );
      }
    }, 200);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    // Reset input value to allow selecting same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);
    if (fileToRemove?.previewUrl) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }

    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);

    if (onRemove) {
      onRemove(fileId);
    }
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (customIcons && customIcons[extension]) {
      return customIcons[extension];
    }

    if (file.type.startsWith('image/')) {
      return <FiImage />;
    }

    // Add more default icons based on extension
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return <FiFile />;
      default:
        return <FiFile />;
    }
  };

  return (
    <Flex direction="column" gap={8} className={`lxs-fileupload-wrapper ${className}`}>
      {label && (
        <Typography as="label" htmlFor={id} variant="label" className="lxs-fileupload-label">
          {label}
          {required && <span className="lxs-fileupload-label__required"> *</span>}
        </Typography>
      )}

      <div
        className={`lxs-fileupload-dropzone ${isDragging ? 'lxs-fileupload-dropzone--active' : ''} ${error ? 'lxs-fileupload-dropzone--error' : ''} ${disabled ? 'lxs-fileupload-dropzone--disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          className="lxs-fileupload-input"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />

        <Flex direction="column" align="center" gap={12} className="lxs-fileupload-content">
          <FiUploadCloud className="lxs-fileupload-icon" />
          <Typography variant="body2" align="center" className="lxs-fileupload-text">
            <Button
              variant="ghost"
              size="sm"
              className="lxs-fileupload-browse-btn"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation(); // Prevent bubbling since parent is also clickable
                inputRef.current?.click();
              }}
            >
              Click to upload
            </Button>
            {' '}or drag and drop
          </Typography>
          {helperText && !error && (
            <Typography variant="caption" color="secondary" className="lxs-fileupload-helper">{helperText}</Typography>
          )}
          {error && (
            <Typography variant="caption" color="error" className="lxs-fileupload-error">
              <FiAlertCircle style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
              {error}
            </Typography>
          )}
        </Flex>
      </div>

      {files.length > 0 && (
        <Flex direction="column" gap={12} className="lxs-fileupload-list">
          {files.map((item) => (
            <Flex key={item.id} align="center" className="lxs-fileupload-item">
              <div className="lxs-fileupload-item__preview">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.file.name} loading="lazy" />
                ) : (
                  getFileIcon(item.file)
                )}
              </div>

              <Flex direction="column" gap={2} className="lxs-fileupload-item__info">
                <Typography variant="body2" weight="medium" className="lxs-fileupload-item__name" title={item.file.name}>
                  {item.file.name}
                </Typography>
                <Flex gap={8} className="lxs-fileupload-item__meta">
                  <Typography variant="caption" color="secondary">{formatFileSize(item.file.size)}</Typography>
                  {item.status === 'error' && (
                    <Typography variant="caption" color="error" className="lxs-fileupload-item__error-text">
                      • {item.error}
                    </Typography>
                  )}
                </Flex>
              </Flex>

              <Flex align="center" className="lxs-fileupload-item__actions">
                {item.status === 'success' && (
                  <FiCheckCircle className="text-success-500" style={{ color: 'var(--lxs-color-success-500)', marginRight: 8 }} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  className="lxs-fileupload-item__remove"
                  onClick={() => handleRemove(item.id)}
                  aria-label="Remove file"
                  disabled={disabled}
                >
                  {item.status === 'error' ? <FiTrash2 /> : <FiX />}
                </Button>
              </Flex>

              {item.status === 'uploading' && (
                <div
                  className="lxs-fileupload-item__progress"
                  style={{ width: `${item.progress}%` }}
                />
              )}
              {item.status === 'error' && (
                <div className="lxs-fileupload-item__progress lxs-fileupload-item__progress--error" style={{ width: '100%' }} />
              )}
              {item.status === 'success' && (
                <div className="lxs-fileupload-item__progress lxs-fileupload-item__progress--complete" style={{ width: '100%' }} />
              )}
            </Flex>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default FileUpload;
