'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { updateProfile } from '@/app/actions';
import { generateAndSendOTP, logout, verifyEmailChangeOtp, verifyEmailOtp } from '@/app/actions/authActions';
import ProfileImageUploader from '@/app/components/ProfileImageUploader';
import OTPVerification from '@/app/components/auth/OTPVerification';
import styles from './Profile.module.css';
import PageHeaderActions from '@/app/components/PageHeaderActions';

export default function ProfileClient({ initialProfile }) {
    const [profile, setProfile] = useState({
        ...initialProfile,
        image: initialProfile?.image || initialProfile?.photoUrl || ''
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [verificationId, setVerificationId] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationSuccess, setVerificationSuccess] = useState('');
    const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
    const [originalEmail, setOriginalEmail] = useState(initialProfile?.email || '');
    const pendingFormDataRef = useRef(null);
    const formRef = useRef(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const nameInputRef = useRef(null);
    const verificationState = profile.isVerified === true
        ? 'verified'
        : profile.isVerified === false
            ? 'unverified'
            : 'pending';
    const verificationLabel = profile.isVerified === true
        ? 'Email verified'
        : profile.isVerified === false
            ? 'Email unverified'
            : 'Email status pending';

    const completion = useMemo(() => {
        const fields = [
            { key: 'name', label: 'Name', value: profile.name },
            { key: 'email', label: 'Email', value: profile.email },
            { key: 'phone', label: 'Phone', value: profile.phone },
            { key: 'dob', label: 'Date of birth', value: profile.dob },
            { key: 'gender', label: 'Gender', value: profile.gender },
            { key: 'image', label: 'Profile photo', value: profile.image },
            { key: 'isVerified', label: 'Email verified', value: profile.isVerified }
        ];
        const completed = fields.filter((field) => {
            if (field.key === 'isVerified') return field.value === true;
            return Boolean(field.value);
        });
        const percent = Math.round((completed.length / fields.length) * 100);
        const missing = fields
            .filter((field) => {
                if (field.key === 'isVerified') return field.value !== true;
                return !field.value;
            })
            .map((field) => field.label);
        return { percent, missing };
    }, [profile]);

    const completionPercent = Number.isFinite(completion.percent) ? completion.percent : 0;
    const completionMissing = Array.isArray(completion.missing) ? completion.missing : [];

    const handleImageUpload = async (url) => {
        setProfile(prev => ({ ...prev, image: url }));
        const formData = new FormData();
        formData.append('name', profile.name || '');
        formData.append('email', profile.email || '');
        formData.append('phone', profile.phone || '');
        formData.append('dob', profile.dob || '');
        formData.append('gender', profile.gender || '');
        formData.append('image', url);

        const result = await updateProfile(formData);
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile picture updated!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update profile picture' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData(e.target);
        if (!formData.get('name')) {
            formData.append('name', profile.name || '');
        }
        formData.append('image', profile.image || '');

        const currentEmail = profile.email || '';
        if (currentEmail && currentEmail !== originalEmail) {
            pendingFormDataRef.current = formData;
            setShowEmailOtpModal(true);
            await handleRequestEmailChange(currentEmail);
            setIsSubmitting(false);
            return;
        }

        const result = await updateProfile(formData);
        setIsSubmitting(false);

        if (result.success) {
            setProfile(prev => ({
                ...prev,
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                dob: formData.get('dob'),
                gender: formData.get('gender')
            }));
            setHasChanges(false);
            setOriginalEmail(formData.get('email') || '');
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update profile' });
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    const handleRequestVerification = async () => {
        if (!profile.email) {
            setVerificationError('Missing email address for verification.');
            return;
        }
        setVerificationLoading(true);
        setVerificationError('');
        setVerificationSuccess('');
        const result = await generateAndSendOTP(profile.email);
        if (result.success) {
            setVerificationId(result.verificationId);
            setVerificationSuccess('Verification code sent to your email.');
        } else {
            setVerificationError(result.error || 'Failed to send verification code.');
        }
        setVerificationLoading(false);
    };

    const handleVerifyOtp = async (code) => {
        setVerificationLoading(true);
        setVerificationError('');
        const result = await verifyEmailOtp(verificationId, code);
        if (result.success) {
            setProfile(prev => ({ ...prev, isVerified: true }));
            setVerificationSuccess('Email verified successfully.');
            setVerificationId('');
        } else {
            setVerificationError(result.error || 'Verification failed.');
        }
        setVerificationLoading(false);
    };

    const handleRequestEmailChange = async (email) => {
        if (!email) {
            setVerificationError('Missing email address for verification.');
            return;
        }
        setVerificationLoading(true);
        setVerificationError('');
        setVerificationSuccess('');
        const result = await generateAndSendOTP(email);
        if (result.success) {
            setVerificationId(result.verificationId);
            setVerificationSuccess('Verification code sent to your new email.');
        } else {
            setVerificationError(result.error || 'Failed to send verification code.');
        }
        setVerificationLoading(false);
    };

    const handleVerifyEmailChange = async (code) => {
        setVerificationLoading(true);
        setVerificationError('');
        const pendingEmail = profile.email || '';
        const result = await verifyEmailChangeOtp(verificationId, code, pendingEmail);
        if (result.success) {
            setProfile(prev => ({ ...prev, isVerified: true }));
            setOriginalEmail(pendingEmail);
            setVerificationSuccess('Email updated and verified.');
            setVerificationId('');
            setShowEmailOtpModal(false);
            const pendingFormData = pendingFormDataRef.current;
            if (pendingFormData) {
                const saveResult = await updateProfile(pendingFormData);
                if (saveResult.success) {
                    setMessage({ type: 'success', text: 'Profile updated successfully!' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                } else {
                    setMessage({ type: 'error', text: saveResult.message || 'Failed to update profile' });
                }
                pendingFormDataRef.current = null;
            }
        } else {
            setVerificationError(result.error || 'Verification failed.');
        }
        setVerificationLoading(false);
    };


    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="My Profile"
                subtitle="Set the details that shape your Keesha experience."
            />

            {message.text && (
                <div className={`${styles.statusMessage} ${message.type === 'success' ? styles.success : styles.error}`}>
                    {message.text}
                </div>
            )}

            <div className={styles.content}>
                <form ref={formRef} onSubmit={handleSubmit} className={styles.formStack}>
                    {completionPercent < 100 && (
                        <section className={`${styles.card} ${styles.fullWidthCard}`}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3>Profile Completeness</h3>
                                    <p>Finish your profile to unlock the full experience.</p>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.progressTrack}>
                                    <div className={styles.progressFill} style={{ width: `${completionPercent}%` }} />
                                </div>
                                <div className={styles.progressMeta}>
                                    <p className={styles.progressPercent}>{completionPercent}% complete</p>
                                    <p className={styles.progressCaption}>
                                        {completionMissing.length === 0
                                            ? 'All profile details are complete.'
                                            : `Missing: ${completionMissing.join(', ')}`}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    <section className={styles.heroCard}>
                        <div className={styles.profileHeader}>
                            <div className={styles.avatarWrap}>
                                <ProfileImageUploader
                                    currentImage={profile.image}
                                    onUploadComplete={handleImageUpload}
                                    userId={profile.uid}
                                />
                            </div>
                            <div className={styles.headerInfo}>
                                <div className={styles.heroNameRow}>
                                    {isEditingName ? (
                                    <input
                                        ref={nameInputRef}
                                        name="name"
                                        type="text"
                                        defaultValue={profile.name}
                                        placeholder="Your name"
                                        required
                                        className={`${styles.heroNameInput} ${styles.editing}`}
                                        onChange={() => setHasChanges(true)}
                                        onBlur={() => setIsEditingName(false)}
                                    />
                                    ) : (
                                        <div className={styles.heroNameText}>
                                            {profile.name || 'Your name'}
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.editButton}
                                        onClick={() => {
                                            setIsEditingName(true);
                                            setTimeout(() => nameInputRef.current?.focus(), 0);
                                        }}
                                        aria-label="Edit name"
                                    >
                                        <Edit3 className={styles.editIcon} size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.profileFields}>
                            <div className={`${styles.metaItem} ${styles.fullWidthItem}`}>
                                <span className={styles.metaLabel}>Email</span>
                                <div className={styles.emailRow}>
                                    <input
                                        name="email"
                                        type="email"
                                        value={profile.email || ''}
                                        onChange={(e) => {
                                            setProfile(prev => ({ ...prev, email: e.target.value }));
                                            setHasChanges(true);
                                        }}
                                        placeholder="you@example.com"
                                        className={`${styles.metaInput} ${styles.emailInput}`}
                                    />
                                </div>
                            </div>

                            {/* Verification section below email field */}
                            {profile.isVerified === false && (
                                <>
                                    <div className={styles.verifyInline}>
                                        <div className={styles.verifyText}>
                                            <p className={styles.actionTitle}>Verify your email</p>
                                            <p className={styles.actionCaption}>
                                                We’ll send a 6-digit code to {profile.email || 'your email'}.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRequestVerification}
                                            className={styles.secondaryBtn}
                                            disabled={verificationLoading}
                                        >
                                            {verificationLoading ? 'Sending...' : 'Send Code'}
                                        </button>
                                    </div>
                                    {verificationSuccess && (
                                        <p className={styles.successNote}>{verificationSuccess}</p>
                                    )}
                                    {verificationId && (
                                        <div className={styles.otpWrap}>
                                            <OTPVerification
                                                email={profile.email}
                                                onVerify={handleVerifyOtp}
                                                onResend={handleRequestVerification}
                                                isLoading={verificationLoading}
                                                error={verificationError}
                                            />
                                        </div>
                                    )}
                                    {verificationError && !verificationId && (
                                        <p className={styles.errorNote}>{verificationError}</p>
                                    )}
                                </>
                            )}

                            {showEmailOtpModal && (
                                <div className={styles.modalOverlay}>
                                    <div className={styles.modalCard}>
                                        <div className={styles.modalHeader}>
                                            <h3>Verify your new email</h3>
                                            <button
                                                type="button"
                                                className={styles.modalClose}
                                                onClick={() => {
                                                    setShowEmailOtpModal(false);
                                                    pendingFormDataRef.current = null;
                                                }}
                                            >
                                                Close
                                            </button>
                                        </div>
                                        <p className={styles.modalSubtext}>
                                            Enter the 6-digit code sent to {profile.email || 'your email'}.
                                        </p>
                                        <div className={styles.modalField}>
                                            <label>New email</label>
                                            <input
                                                type="email"
                                                value={profile.email || ''}
                                                onChange={(e) => {
                                                    setProfile(prev => ({ ...prev, email: e.target.value }));
                                                    setHasChanges(true);
                                                }}
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                        <OTPVerification
                                            email={profile.email}
                                            onVerify={handleVerifyEmailChange}
                                            onResend={() => handleRequestEmailChange(profile.email)}
                                            isLoading={verificationLoading}
                                            error={verificationError}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className={styles.metaRow}>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Phone</span>
                                    <input
                                        name="phone"
                                        type="tel"
                                        defaultValue={profile.phone}
                                        onChange={() => setHasChanges(true)}
                                        placeholder="Add a phone number"
                                        className={styles.metaInput}
                                    />
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Date of Birth</span>
                                    <input
                                        name="dob"
                                        type="date"
                                        defaultValue={profile.dob ? profile.dob.slice(0, 10) : ''}
                                        onChange={() => setHasChanges(true)}
                                        className={styles.metaInput}
                                    />
                                </div>
                                <div className={styles.metaItem}>
                                    <span className={styles.metaLabel}>Gender</span>
                                    <select
                                        name="gender"
                                        defaultValue={profile.gender || ''}
                                        className={styles.metaSelect}
                                        onChange={() => setHasChanges(true)}
                                    >
                                        <option value="" disabled>Select gender</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                            </div>
                            {hasChanges && (
                                <div className={styles.heroActions}>
                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                </form>

                <div className={styles.logoutWrap}>
                    <button type="button" onClick={handleLogout} className={styles.logoutBtn}>
                        Log Out
                    </button>
                </div>
            </div>
        </div >
    );
}
