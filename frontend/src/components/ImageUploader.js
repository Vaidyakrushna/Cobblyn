'use client';
import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../api';

const ImageUploader = ({ value, onChange, label = 'Image', testId = 'image-uploader' }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const data = await api.uploadImage(file);
      onChange(data.url);
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div data-testid={testId}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>{label}</label>}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
          <LinkIcon size={14} color="#6B7280" />
          <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or upload below"
            data-testid={`${testId}-url`}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13 }} />
          {value && (
            <button type="button" onClick={() => onChange('')} title="Clear"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={14} color="#6B7280" />
            </button>
          )}
        </div>
        <button type="button" onClick={onPickFile} disabled={uploading} data-testid={`${testId}-pick`}
          style={{ padding: '8px 12px', border: '1px solid #1a1a1a', background: '#1a1a1a', color: '#fff',
                   borderRadius: 6, cursor: uploading ? 'wait' : 'pointer', fontSize: 12,
                   display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }}
          data-testid={`${testId}-file`} />
      </div>

      {value ? (
        <div style={{ marginTop: 8, width: 80, height: 80, borderRadius: 6, overflow: 'hidden', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Use plain <img> here on purpose: arbitrary user URLs/uploads not in next.config remotePatterns */}
          <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }} data-testid={`${testId}-preview`} />
        </div>
      ) : (
        <div style={{ marginTop: 8, width: 80, height: 80, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageIcon size={20} color="#9CA3AF" />
        </div>
      )}

      {error && <div style={{ color: '#EF4444', fontSize: 12, marginTop: 6 }} data-testid={`${testId}-error`}>{error}</div>}
    </div>
  );
};

export default ImageUploader;
