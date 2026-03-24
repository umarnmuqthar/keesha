'use server';

import { getSession } from './authActions';
import { revalidatePath } from 'next/cache';

/**
 * Add a new income entry
 */
export async function addIncomeEntry(formData: FormData) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };
    const { db } = await import('@/lib/firebase-admin');

    const amount = parseFloat(formData.get('amount') as string);
    const source = formData.get('source') as string;
    const category = formData.get('category') as string || 'Other';
    const date = (formData.get('date') as string) || new Date().toISOString();
    const status = (formData.get('status') as string) || 'Received';
    const notes = formData.get('notes') as string || '';

    if (!amount || !source) return { error: 'Amount and source are required' };

    const newEntry = {
        userId: session.uid,
        amount,
        source,
        category,
        date,
        status,
        notes,
        createdAt: new Date().toISOString()
    };

    await db.collection('incomes').add(newEntry);

    revalidatePath('/incomes');
    return { success: true };
}

/**
 * Update an existing income entry
 */
export async function updateIncomeEntry(id: string, formData: FormData) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };
    const { db } = await import('@/lib/firebase-admin');

    const amount = parseFloat(formData.get('amount') as string);
    const source = formData.get('source') as string;
    const category = formData.get('category') as string;
    const date = formData.get('date') as string;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;

    const updateData: any = {};
    if (!isNaN(amount)) updateData.amount = amount;
    if (source) updateData.source = source;
    if (category) updateData.category = category;
    if (date) updateData.date = date;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await db.collection('incomes').doc(id).update(updateData);

    revalidatePath('/incomes');
    return { success: true };
}

/**
 * Delete an income entry
 */
export async function deleteIncomeEntry(id: string) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };
    const { db } = await import('@/lib/firebase-admin');

    await db.collection('incomes').doc(id).delete();

    revalidatePath('/incomes');
    return { success: true };
}

/**
 * Get all income entries for the current user
 */
export async function getIncomes(userId: string) {
    const { db } = await import('@/lib/firebase-admin');
    const snapshot = await db.collection('incomes')
        .where('userId', '==', userId)
        .get();
    
    const incomes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as any));

    // Sort client-side to avoid index requirement
    return incomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
