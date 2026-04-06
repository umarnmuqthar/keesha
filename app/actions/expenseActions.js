'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from './authActions';

/**
 * Fetch all expenses for the current user
 */
export async function getExpenses() {
  const session = await getSession();
  if (!session) return [];

  const { db } = await import('@/lib/firebase-admin');
  const snapshot = await db.collection('expenses')
    .where('userId', '==', session.uid)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Add a new expense
 * Supports both FormData and direct data object
 */
export async function addExpense(input) {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { db } = await import('@/lib/firebase-admin');
    
    let data = {};
    if (input && typeof input.get === 'function') {
      data = {
        amount: parseFloat(input.get('amount') || 0),
        description: input.get('description') || '',
        category: input.get('category') || 'General',
        date: input.get('date') || new Date().toISOString().split('T')[0],
      };
    } else {
      data = {
        amount: parseFloat(input.amount || 0),
        description: input.description || '',
        category: input.category || 'General',
        date: input.date || new Date().toISOString().split('T')[0],
        source: input.source || 'Manual'
      };
    }

    const newExpense = {
      ...data,
      userId: session.uid,
      createdAt: new Date().toISOString()
    };

    await db.collection('expenses').add(newExpense);
    
    revalidatePath('/expenses');
    return { success: true };
  } catch (e) {
    console.error('Add Expense Error:', e);
    return { success: false, message: e.message };
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id) {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const { db } = await import('@/lib/firebase-admin');
    await db.collection('expenses').doc(id).delete();
    
    revalidatePath('/expenses');
    return { success: true };
  } catch (e) {
    console.error('Delete Expense Error:', e);
    return { success: false };
  }
}
