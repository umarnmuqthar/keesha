'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { getUserSession } from './authActions';

export async function updateProfile(formData) {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, message: 'Not authenticated' };
    const { db } = await import('@/lib/firebase-admin');

    const normalizeIndianPhone = (raw) => {
      if (!raw) return '';
      const digits = String(raw).replace(/\D/g, '');
      if (!digits) return '';
      if (digits.length !== 10) return null;
      return digits;
    };

    const data = {};
    if (formData.has('name')) data.name = formData.get('name');
    if (formData.has('email')) data.email = formData.get('email');
    if (formData.has('phone')) {
      const normalizedPhone = normalizeIndianPhone(formData.get('phone'));
      if (normalizedPhone === null) {
        return { success: false, message: 'Invalid phone number. Use a 10-digit phone number.' };
      }
      data.phone = normalizedPhone;
    }
    if (formData.has('image')) data.image = formData.get('image');
    if (formData.has('baseSalary')) {
      const salary = parseFloat(formData.get('baseSalary'));
      if (!isNaN(salary)) data.baseSalary = salary;
    }

    if (formData.has('dob')) {
      const rawDob = formData.get('dob');
      if (!rawDob) {
        data.dob = '';
      } else {
        const dob = new Date(rawDob);
        if (Number.isNaN(dob.getTime())) {
          return { success: false, message: 'Invalid date of birth.' };
        }

        const today = new Date();
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const dobDate = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());

        if (dobDate > todayDate) {
          return { success: false, message: 'Date of birth cannot be in the future.' };
        }

        let age = todayDate.getFullYear() - dobDate.getFullYear();
        const m = todayDate.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && todayDate.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 13) {
          return { success: false, message: 'You must be at least 13 years old.' };
        }

        data.dob = rawDob;
      }
    }

    if (formData.has('gender')) {
      const rawGender = formData.get('gender') || '';
      const allowed = new Set(['Female', 'Male', 'Non-binary', 'Prefer not to say', '']);
      if (!allowed.has(rawGender)) {
        return { success: false, message: 'Invalid gender value.' };
      }
      data.gender = rawGender;
    }

    await db.collection('users').doc(session.uid).set(data, { merge: true });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Profile Update Error:', e);
    return { success: false, message: 'Failed to update profile' };
  }
}

export async function getCloudinarySignature(userId, transformation = '', options = {}) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const folder = process.env.CLOUDINARY_FOLDER || 'keesha/profiles';

    if (!cloudName || !apiKey || !apiSecret) {
      return { success: false, error: 'Missing Cloudinary configuration.' };
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = userId ? `user_${userId}` : undefined;
    const overwrite = options.overwrite ? 'true' : undefined;
    const invalidate = options.invalidate ? 'true' : undefined;
    const params = {
      folder,
      invalidate,
      overwrite,
      public_id: publicId,
      timestamp,
      transformation: transformation || undefined
    };

    const signatureParts = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`);

    const signature = crypto
      .createHash('sha1')
      .update(`${signatureParts.join('&')}${apiSecret}`)
      .digest('hex');

    return {
      success: true,
      cloudName,
      apiKey,
      folder,
      publicId,
      overwrite,
      invalidate,
      timestamp,
      signature,
      transformation
    };
  } catch (e) {
    console.error('Cloudinary signature error:', e);
    return { success: false, error: 'Failed to generate signature.' };
  }
}

export async function getUserProfile() {
  try {
    const session = await getUserSession();
    if (!session) return null;

    const { db } = await import('@/lib/firebase-admin');
    const doc = await db.collection('users').doc(session.uid).get();
    if (doc.exists) {
      return { ...doc.data(), uid: doc.id };
    }

    return {
      name: session.name || 'User',
      email: session.email,
      uid: session.uid
    };
  } catch (e) {
    console.error('Get Profile Error:', e);
    return null;
  }
}
