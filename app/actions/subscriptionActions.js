'use server';

import { revalidatePath } from 'next/cache';
import { getUserSession } from './authActions';

export async function addSubscription(formData) {
  const session = await getUserSession();
  if (!session) return { success: false, message: 'Unauthorized' };

  const isFreeTrial = formData.get('isFreeTrial') === 'true';
  const rawStartDate = formData.get('startDate');
  const startDate = new Date(rawStartDate);
  if (isNaN(startDate.getTime())) {
    return { success: false, message: 'Invalid start date provided.' };
  }

  let nextRenewalDate = new Date(startDate);
  let trialEndDate = null;

  if (isFreeTrial) {
    const duration = parseInt(formData.get('trialDuration'));
    const unit = formData.get('trialUnit');

    let endDate = new Date(startDate);
    if (unit === 'Days') endDate.setDate(endDate.getDate() + duration);
    if (unit === 'Months') endDate.setMonth(endDate.getMonth() + duration);
    if (unit === 'Years') endDate.setFullYear(endDate.getFullYear() + duration);

    trialEndDate = endDate;
    nextRenewalDate = endDate;
  } else {
    if (formData.get('billingCycle') === 'Monthly') nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    if (formData.get('billingCycle') === 'Yearly') nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    if (formData.get('billingCycle') === 'Quarterly') nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 3);
  }

  const rawData = {
    name: formData.get('name'),
    status: 'Active',
    billingCycle: formData.get('billingCycle'),
    category: formData.get('category'),
    currentCost: parseFloat(formData.get('currentCost')),
    paymentMethod: formData.get('paymentMethod'),
    autoPayActive: formData.get('autoPayActive') === 'on',
    nextRenewalDate: nextRenewalDate.toISOString(),
    trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
    startDate: startDate.toISOString(),
    createdAt: new Date().toISOString(),
    userId: session.uid
  };

  try {
    const { db } = await import('@/lib/firebase-admin');
    const docRef = await db.collection('subscriptions').add(rawData);

    const historyJson = formData.get('history');
    if (historyJson) {
      const history = JSON.parse(historyJson);
      const batch = db.batch();

      if (isFreeTrial) {
        const ref = docRef.collection('ledger').doc();
        batch.set(ref, {
          amount: 0,
          type: 'Trial Start',
          date: startDate.toISOString()
        });
      }

      history.forEach((dateStr) => {
        const ref = docRef.collection('ledger').doc();
        batch.set(ref, {
          amount: rawData.currentCost,
          type: 'Payment',
          date: dateStr
        });
      });

      await batch.commit();

      if (history.length > 0) {
        const lastPaidDate = new Date(history[history.length - 1]);
        let newNext = new Date(lastPaidDate);
        const cycle = formData.get('billingCycle');
        if (cycle === 'Monthly') newNext.setMonth(newNext.getMonth() + 1);
        if (cycle === 'Yearly') newNext.setFullYear(newNext.getFullYear() + 1);
        if (cycle === 'Quarterly') newNext.setMonth(newNext.getMonth() + 3);

        await docRef.update({ nextRenewalDate: newNext.toISOString() });
      }
    } else {
      await docRef.collection('ledger').add({
        amount: isFreeTrial ? 0 : rawData.currentCost,
        type: isFreeTrial ? 'Trial Start' : 'Payment',
        date: startDate.toISOString()
      });
    }

    revalidatePath('/');
    return { success: true, message: 'Subscription added successfully!' };
  } catch (e) {
    console.error('Failed to create subscription', e);
    return { success: false, message: 'Failed to create subscription.' };
  }
}

export async function updateSubscription(id, formData) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const data = {
      name: formData.get('name'),
      billingCycle: formData.get('billingCycle'),
      category: formData.get('category'),
      currentCost: parseFloat(formData.get('currentCost')),
      paymentMethod: formData.get('paymentMethod'),
      autoPayActive: formData.get('autoPayActive') === 'on',
      startDate: new Date(formData.get('startDate')).toISOString(),
      nextRenewalDate: new Date(formData.get('nextRenewalDate')).toISOString()
    };

    await db.collection('subscriptions').doc(id).update(data);
    revalidatePath('/');
    return { success: true, message: 'Subscription updated successfully' };
  } catch (e) {
    console.error('Update Subscription Error:', e);
    return { success: false, message: 'Failed to update subscription' };
  }
}

export async function updateSubscriptionStatus(id, newStatus, effectiveDate) {
  try {
    const { db } = await import('@/lib/firebase-admin');

    if (newStatus === 'Active') {
      const startDate = new Date(effectiveDate);
      const subDoc = await db.collection('subscriptions').doc(id).get();
      const sub = subDoc.data();

      let nextRenewal = new Date(startDate);
      if (sub.billingCycle === 'Monthly') nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      if (sub.billingCycle === 'Yearly') nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
      if (sub.billingCycle === 'Quarterly') nextRenewal.setMonth(nextRenewal.getMonth() + 3);

      await db.collection('subscriptions').doc(id).update({
        status: newStatus,
        nextRenewalDate: nextRenewal.toISOString()
      });
    } else {
      await db.collection('subscriptions').doc(id).update({ status: newStatus });
    }

    await db.collection('subscriptions').doc(id).collection('ledger').add({
      amount: 0,
      type: `Status Change: ${newStatus}`,
      date: new Date(effectiveDate).toISOString()
    });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Update Status Error:', e);
    return { success: false, message: 'Failed to update status' };
  }
}

export async function deleteSubscription(id) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const session = await getUserSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const subDoc = await db.collection('subscriptions').doc(id).get();
    if (!subDoc.exists) return { success: false, message: 'Subscription not found' };
    if (subDoc.data().userId !== session.uid) return { success: false, message: 'Forbidden' };

    const ledgerSnapshot = await db.collection('subscriptions').doc(id).collection('ledger').get();
    const MAX_BATCH_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < ledgerSnapshot.docs.length; i += MAX_BATCH_SIZE) {
      chunks.push(ledgerSnapshot.docs.slice(i, i + MAX_BATCH_SIZE));
    }

    for (const chunk of chunks) {
      const batch = db.batch();
      chunk.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    await db.collection('subscriptions').doc(id).delete();

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Delete Error:', e);
    return { success: false, message: 'Failed to delete subscription' };
  }
}

export async function recordPayment(subscriptionId, amount, date) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('subscriptions').doc(subscriptionId).collection('ledger').add({
      amount: parseFloat(amount),
      type: 'Payment',
      date: new Date(date).toISOString()
    });

    const subDoc = await db.collection('subscriptions').doc(subscriptionId).get();
    if (subDoc.exists && subDoc.data().status === 'Active') {
      const sub = subDoc.data();
      let nextDate = new Date(sub.nextRenewalDate || date);

      if (sub.billingCycle === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      if (sub.billingCycle === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      if (sub.billingCycle === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);

      await db.collection('subscriptions').doc(subscriptionId).update({
        nextRenewalDate: nextDate.toISOString()
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Record Payment Error:', e);
    return { success: false, message: 'Failed to record payment' };
  }
}

export async function addManualPayment(subscriptionId, amount, date) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('subscriptions').doc(subscriptionId).collection('ledger').add({
      amount: parseFloat(amount),
      type: 'Payment',
      date: new Date(date).toISOString()
    });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Manual Payment Error:', e);
    return { success: false, message: 'Failed to add payment' };
  }
}

export async function deletePaymentEntry(subscriptionId, ledgerId) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('subscriptions').doc(subscriptionId).collection('ledger').doc(ledgerId).delete();

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Delete Payment Error:', e);
    return { success: false, message: 'Failed to delete payment' };
  }
}

export async function updatePaymentEntry(subscriptionId, ledgerId, amount, date) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('subscriptions').doc(subscriptionId).collection('ledger').doc(ledgerId).update({
      amount: parseFloat(amount),
      date: new Date(date).toISOString()
    });

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Update Payment Error:', e);
    return { success: false, message: 'Failed to update payment' };
  }
}

export async function addBulkPayments(subscriptionId, amount, dates) {
  try {
    const { db } = await import('@/lib/firebase-admin');
    const batch = db.batch();
    const subRef = db.collection('subscriptions').doc(subscriptionId);

    dates.forEach((dateStr) => {
      const ref = subRef.collection('ledger').doc();
      batch.set(ref, {
        amount: parseFloat(amount),
        type: 'Payment',
        date: dateStr
      });
    });

    await batch.commit();

    revalidatePath('/');
    return { success: true };
  } catch (e) {
    console.error('Bulk Pay Error:', e);
    return { success: false, message: 'Failed to add bulk payments' };
  }
}
