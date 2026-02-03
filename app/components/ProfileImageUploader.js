'use client';

import React, { useState, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import Cropper from 'react-easy-crop';
import styles from './ProfileImageUploader.module.css';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfileImageUploader({ currentImage, onUploadComplete, userId }) {
    const [image, setImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImage(reader.result);
                setShowCropper(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg');
        });
    };

    const handleUpload = async () => {
        if (!image || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);

            const reader = new FileReader();
            reader.readAsDataURL(croppedImageBlob);
            reader.onloadend = () => {
                const base64data = reader.result;
                onUploadComplete(base64data);
                setShowCropper(false);
                setImage(null);
                setIsUploading(false);
            };
        } catch (error) {
            console.error('Conversion failed:', error);
            alert('Failed to process image');
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.previewContainer}>
                {currentImage ? (
                    <img src={currentImage} alt="Profile" className={styles.preview} />
                ) : (
                    <div className={styles.placeholder}>
                        <span>📸</span>
                    </div>
                )}
                <label className={styles.uploadBtn} aria-label="Edit photo">
                    <Pencil size={14} />
                    <input type="file" accept="image/*" onChange={onFileChange} hidden />
                </label>
            </div>

            {showCropper && (
                <div className={styles.cropperOverlay}>
                    <div className={styles.cropperModal}>
                        <div className={styles.cropperHeader}>
                            <h3>Crop Profile Picture</h3>
                        </div>
                        <div className={styles.cropperContent}>
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className={styles.cropperControls}>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className={styles.zoomRange}
                            />
                        </div>
                        <div className={styles.cropperActions}>
                            <button
                                onClick={() => setShowCropper(false)}
                                className={styles.cancelBtn}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                className={styles.saveBtn}
                                disabled={isUploading}
                            >
                                {isUploading ? 'Uploading...' : 'Apply Crop'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
