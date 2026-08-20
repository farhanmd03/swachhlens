import React, { useRef } from 'react';
import { Camera, UploadCloud, X } from 'lucide-react';

/**
 * Image capture component.
 *
 * Uses a single reliable <input type="file" accept="image/*"> for both
 * desktop and mobile. On mobile browsers that support it, a separate
 * "Use Camera" button adds capture="environment". On desktop, capture
 * attribute is omitted entirely so the standard file picker is used.
 */
export default function ImageCapture({ onImageSelect, previewUrl, disabled }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    // Reset the input so the same file can be re-selected after removal
    e.target.value = '';
  };

  const handleRemove = () => {
    onImageSelect(null);
  };

  return (
    <div className="image-capture-container">
      {previewUrl ? (
        <div className="image-preview-wrapper">
          <img src={previewUrl} alt="Selected waste evidence" className="preview-image" />
          <button
            type="button"
            className="btn btn-secondary remove-image-btn"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X size={16} />
            <span>Change / Remove Photo</span>
          </button>
        </div>
      ) : (
        <div className="upload-dropzone">
          <div className="upload-icon-circle">
            <Camera size={26} className="upload-icon" />
          </div>
          <h4 className="upload-title">Add a Photo of the Waste</h4>
          <p className="upload-subtitle">
            Clear photos help Gemini AI accurately estimate volume and categorize waste type.
          </p>

          <div className="upload-actions">
            <button
              type="button"
              className="btn btn-primary btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <UploadCloud size={16} />
              <span>Choose / Upload Image</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-camera"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled}
            >
              <Camera size={16} />
              <span>Take Photo with Camera</span>
            </button>
          </div>
        </div>
      )}

      {/* Plain file input — no capture attribute, works on all devices */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Choose image file"
      />

      {/* Camera input — capture attribute hints mobile browsers to open camera. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-label="Take photo with camera"
      />
    </div>
  );
}
