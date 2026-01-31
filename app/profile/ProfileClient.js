'use client';

import React, { useState } from 'react';
import { updateProfile } from '../actions';
import { logout } from '../actions/authActions';
import ProfileImageUploader from '../components/ProfileImageUploader';
import styles from './Profile.module.css';
import PageHeader from '../components/PageHeader';

export default function ProfileClient({ initialProfile }) {
    const [profile, setProfile] = useState(initialProfile);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleImageUpload = async (url) => {
        setProfile(prev => ({ ...prev, image: url }));
        const formData = new FormData();
        formData.append('name', profile.name);
        formData.append('email', profile.email);
        formData.append('phone', profile.phone || '');
        formData.append('image', url);

        const result = await updateProfile(formData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData(e.target);
        formData.append('image', profile.image || '');

        const result = await updateProfile(formData);
        setIsSubmitting(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className={styles.container}>
            <PageHeader title="Profile" subtitle="Manage your personal information and account." />

            {message.text && (
                <div className={`${styles.statusMessage} ${message.type === 'success' ? styles.success : styles.error}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.content}>
                <header className={styles.profileHeader}>
                    <ProfileImageUploader
                        currentImage={profile.image}
                        onUploadComplete={(url) => setProfile(prev => ({ ...prev, image: url }))}
                        userId={profile.uid}
                    />
                    <div className={styles.headerInfo}>
                        <h2>{profile.name || 'Your Name'}</h2>
                        <p>{profile.email}</p>
                    </div>
                </header>

                <div className={styles.section}>
                    <p className={styles.sectionTitle}>Account Information</p>
                    <div className={styles.card}>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.formItem}>
                                <label>Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={profile.name}
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>
                            <div className={styles.formItem}>
                                <label>Email</label>
                                <input
                                    name="email" // Added name for form submission
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    title="Email cannot be changed"
                                />
                            </div>
                            <div className={styles.formItem}>
                                <label>Phone Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    defaultValue={profile.phone}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </form>
                    </div>
                </div>

                <div className={styles.section}>
                    <p className={styles.sectionTitle}>Account Actions</p>
                    <div className={styles.card}>
                        <div className={styles.formItem} style={{ borderBottom: 'none' }}>
                            <label>Sign Out</label>
                            <button onClick={handleLogout} className={styles.logoutBtn}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        onClick={() => {
                            const form = document.querySelector('form');
                            if (form) {
                                // Trigger form submission
                                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }}
                        className={styles.saveBtn}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
