'use server';

import { revalidatePath } from 'next/cache';
import { getUserSession } from './authActions';

export async function addLoan(formData) {
  try {
    const session = await getUserSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const rawData = {
      userId: session.uid,
      name: formData.get('name'),
      loanAmount: parseFloat(formData.get('loanAmount') || 0),
      creditedAmount: parseFloat(formData.get('creditedAmount') || 0),
      totalPayable: parseFloat(formData.get('totalPayable') || 0),
      emiAmount: parseFloat(formData.get('emiAmount') || 0),
      tenure: parseInt(formData.get('tenure') || 0),
      dueDate: parseInt(formData.get('dueDate') || 1),
      startDate: formData.get('startDate'),
      hasDownpayment: formData.get('hasDownpayment') === 'true',
      downpaymentAmount: parseFloat(formData.get('downpaymentAmount') || 0),
      processingFee: parseFloat(formData.get('processingFee') || 0),
      gstAmount: parseFloat(formData.get('gstAmount') || 0),
      interestRate: parseFloat(formData.get('interestRate') || 0),
      schedule: JSON.parse(formData.get('schedule') || '[]'),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    const { db } = await import('@/lib/firebase-admin');
    const docRef = await db.collection('loans').add(rawData);

    if (rawData.schedule && rawData.schedule.length > 0) {
      const batch = db.batch();
      rawData.schedule.forEach((p) => {
        if (p.isPaid) {
          const pRef = docRef.collection('payments').doc(p.date);
          batch.set(pRef, {
            paidAt: new Date().toISOString(),
            amount: parseFloat(p.amount) || 0
          });
        }
      });
      await batch.commit();
    }

    revalidatePath('/loans');
    return { success: true, message: 'Loan added successfully!' };
  } catch (e) {
    console.error('Add Loan Error:', e);
    return { success: false, message: 'Failed to create loan' };
  }
}

export async function toggleLoanPayment(loanId, monthYear, isPaid) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const paymentRef = db.collection('loans').doc(loanId).collection('payments').doc(monthYear);

    if (isPaid) {
      await paymentRef.set({
        paidAt: new Date().toISOString(),
        amount: 0
      });
    } else {
      await paymentRef.delete();
    }

    await checkAndAutoCloseLoan(loanId);

    revalidatePath('/loans');
    revalidatePath(`/loans/${loanId}`);
    return { success: true };
  } catch (e) {
    console.error('Toggle Loan Payment Error:', e);
    return { success: false };
  }
}

export async function markLoanPaidWithAmount(loanId, paymentDate, amount) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const paymentRef = db.collection('loans').doc(loanId).collection('payments').doc(paymentDate);

    await paymentRef.set({
      paidAt: new Date().toISOString(),
      amount: parseFloat(amount) || 0
    }, { merge: true });

    await checkAndAutoCloseLoan(loanId);

    revalidatePath('/loans');
    revalidatePath(`/loans/${loanId}`);
    return { success: true };
  } catch (e) {
    console.error('Mark Loan Paid With Amount Error:', e);
    return { success: false, message: 'Failed to mark as paid' };
  }
}

export async function updateLoanPayment(loanId, paymentDate, data) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const paymentRef = db.collection('loans').doc(loanId).collection('payments').doc(paymentDate);

    if (data.newDate && data.newDate !== paymentDate) {
      const batch = db.batch();
      batch.delete(paymentRef);

      const newPaymentRef = db.collection('loans').doc(loanId).collection('payments').doc(data.newDate);
      batch.set(newPaymentRef, {
        paidAt: new Date().toISOString(),
        amount: parseFloat(data.amount) || 0,
        description: data.description || '',
        edited: true
      });
      await batch.commit();
    } else {
      await paymentRef.update({
        amount: parseFloat(data.amount) || 0,
        description: data.description || '',
        edited: true
      });
    }

    revalidatePath('/loans');
    revalidatePath(`/loans/${loanId}`);
    return { success: true };
  } catch (e) {
    console.error('Update Loan Payment Error:', e);
    return { success: false, message: 'Failed to update payment' };
  }
}

export async function deleteLoanPayment(loanId, paymentDate) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('loans').doc(loanId).collection('payments').doc(paymentDate).delete();

    await checkAndAutoCloseLoan(loanId);

    revalidatePath('/loans');
    revalidatePath(`/loans/${loanId}`);
    return { success: true };
  } catch (e) {
    console.error('Delete Loan Payment Error:', e);
    return { success: false, message: 'Failed to delete payment' };
  }
}

async function checkAndAutoCloseLoan(loanId) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const loanDoc = await db.collection('loans').doc(loanId).get();
    if (!loanDoc.exists) return;

    const loan = loanDoc.data();
    const schedule = loan.schedule || [];

    const paymentsSnapshot = await db.collection('loans').doc(loanId).collection('payments').get();
    const paymentDates = new Set(paymentsSnapshot.docs.map((d) => d.id));

    const allPaid = schedule.every((p) => paymentDates.has(p.date));
    const newStatus = allPaid ? 'Closed' : 'Active';

    if (loan.status !== newStatus) {
      await db.collection('loans').doc(loanId).update({ status: newStatus });
    }
  } catch (e) {
    console.error('Auto-close check failed:', e);
  }
}

export async function updateLoan(id, formData) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const data = {
      name: formData.get('name'),
      loanAmount: parseFloat(formData.get('loanAmount') || 0),
      creditedAmount: parseFloat(formData.get('creditedAmount') || 0),
      totalPayable: parseFloat(formData.get('totalPayable') || 0),
      emiAmount: parseFloat(formData.get('emiAmount') || 0),
      tenure: parseInt(formData.get('tenure') || 0),
      dueDate: parseInt(formData.get('dueDate') || 1),
      startDate: formData.get('startDate'),
      hasDownpayment: formData.get('hasDownpayment') === 'true',
      downpaymentAmount: parseFloat(formData.get('downpaymentAmount') || 0),
      processingFee: parseFloat(formData.get('processingFee') || 0),
      gstAmount: parseFloat(formData.get('gstAmount') || 0),
      interestRate: parseFloat(formData.get('interestRate') || 0),
      schedule: JSON.parse(formData.get('schedule') || '[]'),
      status: formData.get('status') || 'Active'
    };

    const loanRef = db.collection('loans').doc(id);
    await loanRef.update(data);

    if (data.schedule && data.schedule.length > 0) {
      const batch = db.batch();
      data.schedule.forEach((p) => {
        const pRef = loanRef.collection('payments').doc(p.date);
        if (p.isPaid) {
          batch.set(
            pRef,
            {
              paidAt: new Date().toISOString(),
              amount: parseFloat(p.amount) || 0
            },
            { merge: true }
          );
        } else {
          batch.delete(pRef);
        }
      });
      await batch.commit();
    }

    revalidatePath('/loans');
    revalidatePath(`/loans/${id}`);
    return { success: true, message: 'Loan updated successfully' };
  } catch (e) {
    console.error('Update Loan Error:', e);
    return { success: false, message: 'Failed to update loan' };
  }
}

export async function deleteLoan(id) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const session = await getUserSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const loanDoc = await db.collection('loans').doc(id).get();
    if (!loanDoc.exists) return { success: false, message: 'Loan not found' };
    if (loanDoc.data().userId !== session.uid) return { success: false, message: 'Forbidden' };

    const paymentsSnapshot = await db.collection('loans').doc(id).collection('payments').get();
    const batch = db.batch();
    paymentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    await db.collection('loans').doc(id).delete();

    revalidatePath('/loans');
    return { success: true };
  } catch (e) {
    console.error('Delete Loan Error:', e);
    return { success: false, message: 'Failed to delete loan' };
  }
}
