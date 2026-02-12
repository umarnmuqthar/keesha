'use server';

import { revalidatePath } from 'next/cache';
import { getUserSession } from './authActions';

export async function addCreditCard(formData) {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, message: 'Unauthorized' };
    const { db } = await import('@/lib/firebase-admin');

    const rawData = {
      userId: session.uid,
      name: formData.get('name'),
      number: formData.get('number'),
      expiry: formData.get('expiry'),
      brand: formData.get('brand'),
      totalLimit: parseFloat(formData.get('totalLimit') || 0),
      statementBalance: parseFloat(formData.get('statementBalance') || 0),
      totalPaid: 0,
      dueDate: formData.get('dueDate'),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    await db.collection('creditcards').add(rawData);
    revalidatePath('/creditcards');
    return { success: true, message: 'Card added successfully!' };
  } catch (e) {
    console.error('Add Credit Card Error:', e);
    return { success: false, message: 'Failed to create card' };
  }
}

export async function updateCreditCard(id, formData) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const data = {
      name: formData.get('name'),
      expiry: formData.get('expiry'),
      totalLimit: parseFloat(formData.get('totalLimit') || 0),
      statementBalance: parseFloat(formData.get('statementBalance') || 0),
      dueDate: formData.get('dueDate')
    };

    await db.collection('creditcards').doc(id).update(data);
    revalidatePath('/creditcards');
    revalidatePath(`/creditcards/${id}`);
    return { success: true, message: 'Card updated successfully' };
  } catch (e) {
    console.error('Update Card Error:', e);
    return { success: false, message: 'Failed to update card' };
  }
}

export async function deleteCreditCard(id) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const txSnapshot = await db.collection('creditcards').doc(id).collection('transactions').get();
    const batch = db.batch();
    txSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await db.collection('creditcards').doc(id).delete();
    revalidatePath('/creditcards');
    return { success: true };
  } catch (e) {
    console.error('Delete Card Error:', e);
    return { success: false, message: 'Failed to delete card' };
  }
}

export async function addCardTransaction(cardId, formData) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const type = formData.get('type');
    const amount = parseFloat(formData.get('amount') || 0);
    const date = formData.get('date') || new Date().toISOString();
    const description = formData.get('description') || '';

    const cardRef = db.collection('creditcards').doc(cardId);

    await db.runTransaction(async (transaction) => {
      const cardDoc = await transaction.get(cardRef);
      if (!cardDoc.exists) throw new Error('Card not found');

      const card = cardDoc.data();
      let newStatementBalance = card.statementBalance || 0;
      let newTotalPaid = card.totalPaid || 0;

      if (type === 'Expense') {
        newStatementBalance += amount;
      } else if (type === 'Payment') {
        newTotalPaid += amount;
      }

      const txRef = cardRef.collection('transactions').doc();
      transaction.set(txRef, {
        type,
        amount,
        date,
        description,
        createdAt: new Date().toISOString()
      });

      transaction.update(cardRef, {
        statementBalance: newStatementBalance,
        totalPaid: newTotalPaid
      });
    });

    revalidatePath('/creditcards');
    revalidatePath(`/creditcards/${cardId}`);
    return { success: true };
  } catch (e) {
    console.error('Add Card Transaction Error:', e);
    return { success: false, message: 'Failed to log transaction' };
  }
}

export async function deleteCardTransaction(cardId, transactionId) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const cardRef = db.collection('creditcards').doc(cardId);
    const txRef = cardRef.collection('transactions').doc(transactionId);

    await db.runTransaction(async (transaction) => {
      const cardDoc = await transaction.get(cardRef);
      const txDoc = await transaction.get(txRef);

      if (!cardDoc.exists || !txDoc.exists) throw new Error('Not found');

      const card = cardDoc.data();
      const tx = txDoc.data();

      let newStatementBalance = card.statementBalance || 0;
      let newTotalPaid = card.totalPaid || 0;

      if (tx.type === 'Expense') {
        newStatementBalance -= tx.amount;
      } else if (tx.type === 'Payment') {
        newTotalPaid -= tx.amount;
      }

      transaction.delete(txRef);
      transaction.update(cardRef, {
        statementBalance: newStatementBalance,
        totalPaid: newTotalPaid
      });
    });

    revalidatePath('/creditcards');
    revalidatePath(`/creditcards/${cardId}`);
    return { success: true };
  } catch (e) {
    console.error('Delete Transaction Error:', e);
    return { success: false, message: 'Failed to delete transaction' };
  }
}
