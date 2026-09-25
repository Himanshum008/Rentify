import React, { useState, useRef } from 'react';
import { UploadCloud, X, Heart, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../services/api';

const ImageUploadDropzone = ({ images, setImages, maxPhotos = 10 }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxPhotos) {
      setError(`You can upload a maximum of ${maxPhotos} photos.`);
      return;
    }

    setError('');
    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success && data.urls) {
        setImages((prev) => [...prev, ...data.urls]);
      }
    } catch (err) {
      console.error('Upload Error:', err);
      // Fallback: Read as Data URL directly in browser if server upload fails
      try {
        const base64Promises = files.map(
          (file) =>
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(file);
            })
        );
        const base64Urls = await Promise.all(base64Promises);
        setImages((prev) => [...prev, ...base64Urls]);
      } catch (fallbackErr) {
        setError('Failed to process image files.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
      />

      {/* Main Upload Dropzone matching Screenshot 3 */}
      <div
        className="upload-dropzone"
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #93c5fd',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: '#f8faff',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Uploading to Cloudinary...</span>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto'
              }}
            >
              <UploadCloud size={28} />
            </div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary)' }}>
              Click to upload
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              or drag and drop
            </div>
            <div style={{ color: 'var(--text-light)', fontSize: '12px', marginTop: '4px' }}>
              JPG, PNG, WEBP (Max 10MB each) • {images.length}/{maxPhotos} uploaded
            </div>
          </>
        )}
      </div>

      {error && (
        <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '8px' }}>{error}</div>
      )}

      {/* Photo Previews Grid matching Screenshot 3 */}
      {images.length > 0 && (
        <div className="photo-previews-grid">
          {images.map((imgUrl, index) => (
            <div key={index} className="photo-preview-item">
              <img src={imgUrl} alt={`Upload ${index + 1}`} />
              <button
                type="button"
                className="photo-delete-btn"
                onClick={() => handleRemovePhoto(index)}
                title="Remove photo"
              >
                <X size={16} />
              </button>
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadDropzone;
