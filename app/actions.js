
'use server'

import { db } from '../lib/firebase-admin'
import { revalidatePath } from 'next/cache'
import { getSession } from './actions/authActions'

export async function addSubscription(formData) {
    const session = await getSession();
    if (!session) return { success: false, message: 'Unauthorized' };

    const isFreeTrial = formData.get('isFreeTrial') === 'true';

    // Logic: Calculate Dates
    const rawStartDate = formData.get('startDate');
    console.log('[DEBUG] Raw Start Date:', rawStartDate);

    const startDate = new Date(rawStartDate);
    console.log('[DEBUG] Parsed Start Date:', startDate.toISOString());

    let nextRenewalDate = new Date(startDate);
    let trialEndDate = null;

    if (isFreeTrial) {
        const duration = parseInt(formData.get('trialDuration'));
        const unit = formData.get('trialUnit');
        console.log('[DEBUG] Free Trial:', duration, unit);

        let endDate = new Date(startDate);
        if (unit === 'Days') endDate.setDate(endDate.getDate() + duration);
        if (unit === 'Months') endDate.setMonth(endDate.getMonth() + duration);
        if (unit === 'Years') endDate.setFullYear(endDate.getFullYear() + duration);

        console.log('[DEBUG] Calculated End Date:', endDate.toISOString());

        trialEndDate = endDate;
        nextRenewalDate = endDate; // Renewal happens when trial ends
    } else {
        // Normal Active Subscription
        if (formData.get('billingCycle') === 'Monthly') nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
        if (formData.get('billingCycle') === 'Yearly') nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
        if (formData.get('billingCycle') === 'Quarterly') nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 3);
    }

    const rawData = {
        name: formData.get('name'),
        status: 'Active', // Always Active, even if in Free Trial
        billingCycle: formData.get('billingCycle'),
        category: formData.get('category'),
        currentCost: parseFloat(formData.get('currentCost')),
        paymentMethod: formData.get('paymentMethod'),
        autoPayActive: formData.get('autoPayActive') === 'on',
        nextRenewalDate: nextRenewalDate.toISOString(), // Store as string for simpler serialization or use Date
        trialEndDate: trialEndDate ? trialEndDate.toISOString() : null,
        startDate: startDate.toISOString(), // Store Start Date
        createdAt: new Date().toISOString(),
        userId: session.uid
    }

    try {
        const docRef = await db.collection('subscriptions').add(rawData);

        // Handle History Backfill
        const historyJson = formData.get('history');
        if (historyJson) {
            const history = JSON.parse(historyJson);
            const batch = db.batch();

            // Add Initial/Trial Entry if needed (unless history covers it?)
            // Actually, history usually covers "Payments". Trial start is separate.
            // If Free Trial, we still add "Trial Start".
            if (isFreeTrial) {
                const ref = docRef.collection('ledger').doc();
                batch.set(ref, {
                    amount: 0,
                    type: 'Trial Start',
                    date: startDate.toISOString()
                });
            } else {
                // For normal subs, the first "payment" might be in history or not.
                // If user unchecks the first date, we don't add it.
                // If history is empty but we have start date, do we add initial payment?
                // Current logic: "Add Initial Ledger Entry".
                // New Logic: If history is provided (even empty array), we rely ONLY on that + isFreeTrial logic?
                // User might just want to Skip.
                // If history is NOT provided (undefined/null), fall back to legacy behavior (auto add 1st payment).
            }

            history.forEach(dateStr => {
                const ref = docRef.collection('ledger').doc();
                batch.set(ref, {
                    amount: rawData.currentCost,
                    type: 'Payment',
                    date: dateStr // Already ISO string from client
                });
            });

            await batch.commit();

            // Update Next Renewal Date based on LAST paid history item
            if (history.length > 0) {
                const lastPaidDate = new Date(history[history.length - 1]);
                // Calculate next due date from last paid date
                let newNext = new Date(lastPaidDate);
                const cycle = formData.get('billingCycle');
                if (cycle === 'Monthly') newNext.setMonth(newNext.getMonth() + 1);
                if (cycle === 'Yearly') newNext.setFullYear(newNext.getFullYear() + 1);
                if (cycle === 'Quarterly') newNext.setMonth(newNext.getMonth() + 3);

                await docRef.update({ nextRenewalDate: newNext.toISOString() });
            }

        } else {
            // Legacy Behavior: Just add start date payment/trial
            await docRef.collection('ledger').add({
                amount: isFreeTrial ? 0 : rawData.currentCost,
                type: isFreeTrial ? 'Trial Start' : 'Payment',
                date: startDate.toISOString()
            });
        }

        revalidatePath('/')
        return { success: true, message: 'Subscription added successfully!' }
    } catch (e) {
        console.error('Failed to create subscription', e)
        return { success: false, message: 'Failed to create subscription.' }
    }
}

export async function updateSubscription(id, formData) {
    try {
        const data = {
            name: formData.get('name'),
            billingCycle: formData.get('billingCycle'),
            category: formData.get('category'),
            currentCost: parseFloat(formData.get('currentCost')),
            paymentMethod: formData.get('paymentMethod'),
            autoPayActive: formData.get('autoPayActive') === 'on',
            startDate: new Date(formData.get('startDate')).toISOString(), // Persist Start Date
            nextRenewalDate: new Date(formData.get('nextRenewalDate')).toISOString(),
        }

        // Optional: Update nextRenewalDate logic if cycle changes? 
        // Keeping it simple for now, just updating basic fields.

        await db.collection('subscriptions').doc(id).update(data);

        revalidatePath('/');
        revalidatePath(`/subscription/${id}`);
        return { success: true, message: 'Subscription updated successfully' };
    } catch (e) {
        console.error('Update Subscription Error:', e);
        return { success: false, message: 'Failed to update subscription' };
    }
}

export async function updateSubscriptionStatus(id, newStatus, effectiveDate) {
    try {
        if (newStatus === 'Active') {
            // Reactivation Logic: Reset dates based on effective date (New Start Date)
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
            await db.collection('subscriptions').doc(id).update({
                status: newStatus
            });
        }

        await db.collection('subscriptions').doc(id).collection('ledger').add({
            amount: 0,
            type: `Status Change: ${newStatus}`,
            date: new Date(effectiveDate).toISOString()
        });

        revalidatePath('/');
        revalidatePath(`/subscription/${id}`);
        return { success: true };
    } catch (e) {
        console.error('Update Status Error:', e);
        return { success: false, message: 'Failed to update status' };
    }
}

export async function deleteSubscription(id) {
    try {
        console.log('--- DELETE ACTION CALLED ---');
        console.log('Received ID:', id);

        // Recursive delete is handled by CLI usually, but for code we must delete subcollections manually?
        // Actually, if we just delete the parent doc, the subcollections become orphaned but don't cost reads (though they take space).
        // For this scale, we can just delete the doc. The UI won't query orphaned subcollections.
        // Better: delete ledger then doc.

        const ledgerSnapshot = await db.collection('subscriptions').doc(id).collection('ledger').get();
        const batch = db.batch();
        ledgerSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        await db.collection('subscriptions').doc(id).delete();

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Delete Error:', e);
        return { success: false, message: 'Failed to delete subscription' };
    }
}

export async function updateProfile(formData) {
    try {
        const session = await getSession();
        if (!session) return { success: false, message: 'Not authenticated' };

        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            image: formData.get('image'),
        };

        await db.collection('users').doc(session.uid).set(data, { merge: true });

        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Profile Update Error:', e);
        return { success: false, message: 'Failed to update profile' };
    }
}

export async function recordPayment(subscriptionId, amount, date) {
    try {
        // 1. Add to Ledger
        await db.collection('subscriptions').doc(subscriptionId).collection('ledger').add({
            amount: parseFloat(amount),
            type: 'Payment',
            date: new Date(date).toISOString()
        });

        // 2. Update Next Renewal Date automatically
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
        revalidatePath(`/subscription/${subscriptionId}`);
        return { success: true };
    } catch (e) {
        console.error('Record Payment Error:', e);
        return { success: false, message: 'Failed to record payment' };
    }
}

export async function addManualPayment(subscriptionId, amount, date) {
    try {
        await db.collection('subscriptions').doc(subscriptionId).collection('ledger').add({
            amount: parseFloat(amount),
            type: 'Payment',
            date: new Date(date).toISOString()
        });

        revalidatePath('/');
        revalidatePath(`/subscription/${subscriptionId}`);
        return { success: true };
    } catch (e) {
        console.error('Manual Payment Error:', e);
        return { success: false, message: 'Failed to add payment' };
    }
}

export async function deletePaymentEntry(subscriptionId, ledgerId) {
    try {
        await db.collection('subscriptions').doc(subscriptionId).collection('ledger').doc(ledgerId).delete();

        revalidatePath('/');
        revalidatePath(`/subscription/${subscriptionId}`);
        return { success: true };
    } catch (e) {
        console.error('Delete Payment Error:', e);
        return { success: false, message: 'Failed to delete payment' };
    }
}

export async function updatePaymentEntry(subscriptionId, ledgerId, amount, date) {
    try {
        await db.collection('subscriptions').doc(subscriptionId).collection('ledger').doc(ledgerId).update({
            amount: parseFloat(amount),
            date: new Date(date).toISOString()
        });

        revalidatePath('/');
        revalidatePath(`/subscription/${subscriptionId}`);
        return { success: true };
    } catch (e) {
        console.error('Update Payment Error:', e);
        return { success: false, message: 'Failed to update payment' };
    }
}

export async function addBulkPayments(subscriptionId, amount, dates) {
    try {
        const batch = db.batch();
        const subRef = db.collection('subscriptions').doc(subscriptionId);

        dates.forEach(dateStr => {
            const ref = subRef.collection('ledger').doc();
            batch.set(ref, {
                amount: parseFloat(amount),
                type: 'Payment',
                date: dateStr
            });
        });

        await batch.commit();

        revalidatePath('/');
        revalidatePath(`/subscription/${subscriptionId}`);
        return { success: true };
    } catch (e) {
        console.error('Bulk Pay Error:', e);
        return { success: false, message: 'Failed to add bulk payments' };
    }
}

export async function addLoan(formData) {
    try {
        const session = await getSession();
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
            startDate: formData.get('startDate'), // YYYY-MM
            hasDownpayment: formData.get('hasDownpayment') === 'true',
            downpaymentAmount: parseFloat(formData.get('downpaymentAmount') || 0),
            processingFee: parseFloat(formData.get('processingFee') || 0),
            gstAmount: parseFloat(formData.get('gstAmount') || 0),
            interestRate: parseFloat(formData.get('interestRate') || 0),
            schedule: JSON.parse(formData.get('schedule') || '[]'),
            status: 'Active',
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('loans').add(rawData);

        // Sync history to payments subcollection
        if (rawData.schedule && rawData.schedule.length > 0) {
            const batch = db.batch();
            rawData.schedule.forEach(p => {
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
    // monthYear format: YYYY-MM or specific date tag
    try {
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
        revalidatePath(`/loan/${loanId}`);
        return { success: true };
    } catch (e) {
        console.error('Toggle Loan Payment Error:', e);
        return { success: false };
    }
}

export async function updateLoanPayment(loanId, paymentDate, data) {
    try {
        const paymentRef = db.collection('loans').doc(loanId).collection('payments').doc(paymentDate);

        // If the date changed, we need to delete the old document and create a new one
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
        revalidatePath(`/loan/${loanId}`);
        return { success: true };
    } catch (e) {
        console.error('Update Loan Payment Error:', e);
        return { success: false, message: 'Failed to update payment' };
    }
}

export async function deleteLoanPayment(loanId, paymentDate) {
    try {
        await db.collection('loans').doc(loanId).collection('payments').doc(paymentDate).delete();

        await checkAndAutoCloseLoan(loanId);

        revalidatePath('/loans');
        revalidatePath(`/loan/${loanId}`);
        return { success: true };
    } catch (e) {
        console.error('Delete Loan Payment Error:', e);
        return { success: false, message: 'Failed to delete payment' };
    }
}

async function checkAndAutoCloseLoan(loanId) {
    try {
        const loanDoc = await db.collection('loans').doc(loanId).get();
        if (!loanDoc.exists) return;

        const loan = loanDoc.data();
        const schedule = loan.schedule || [];

        // Fetch all recorded payments
        const paymentsSnapshot = await db.collection('loans').doc(loanId).collection('payments').get();
        const paymentDates = new Set(paymentsSnapshot.docs.map(d => d.id));

        // Check if all scheduled dates are paid
        const allPaid = schedule.every(p => paymentDates.has(p.date));

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

        // Sync history to payments subcollection
        if (data.schedule && data.schedule.length > 0) {
            const batch = db.batch();
            data.schedule.forEach(p => {
                const pRef = loanRef.collection('payments').doc(p.date);
                if (p.isPaid) {
                    batch.set(pRef, {
                        paidAt: new Date().toISOString(),
                        amount: parseFloat(p.amount) || 0
                    }, { merge: true });
                } else {
                    batch.delete(pRef);
                }
            });
            await batch.commit();
        }

        revalidatePath('/loans');
        revalidatePath(`/loan/${id}`);
        return { success: true, message: 'Loan updated successfully' };
    } catch (e) {
        console.error('Update Loan Error:', e);
        return { success: false, message: 'Failed to update loan' };
    }
}

export async function deleteLoan(id) {
    try {
        // Delete payments subcollection first
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
export async function addCreditCard(formData) {
    try {
        const session = await getSession();
        if (!session) return { success: false, message: 'Unauthorized' };

        const rawData = {
            userId: session.uid,
            name: formData.get('name'),
            number: formData.get('number'), // Masked or partial usually, but user asked for detection
            expiry: formData.get('expiry'),
            brand: formData.get('brand'),
            totalLimit: parseFloat(formData.get('totalLimit') || 0),
            statementBalance: parseFloat(formData.get('statementBalance') || 0),
            totalPaid: 0,
            dueDate: formData.get('dueDate'), // ISO or date string
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
        const data = {
            name: formData.get('name'),
            expiry: formData.get('expiry'),
            totalLimit: parseFloat(formData.get('totalLimit') || 0),
            statementBalance: parseFloat(formData.get('statementBalance') || 0),
            dueDate: formData.get('dueDate')
        };

        await db.collection('creditcards').doc(id).update(data);
        revalidatePath('/creditcards');
        revalidatePath(`/creditcard/${id}`);
        return { success: true, message: 'Card updated successfully' };
    } catch (e) {
        console.error('Update Card Error:', e);
        return { success: false, message: 'Failed to update card' };
    }
}

export async function deleteCreditCard(id) {
    try {
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
        const type = formData.get('type'); // 'Expense' or 'Payment'
        const amount = parseFloat(formData.get('amount') || 0);
        const date = formData.get('date') || new Date().toISOString();
        const description = formData.get('description') || '';

        const cardRef = db.collection('creditcards').doc(cardId);

        await db.runTransaction(async (transaction) => {
            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists) throw new Error("Card not found");

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
        revalidatePath(`/creditcard/${cardId}`);
        return { success: true };
    } catch (e) {
        console.error('Add Card Transaction Error:', e);
        return { success: false, message: 'Failed to log transaction' };
    }
}

export async function deleteCardTransaction(cardId, transactionId) {
    try {
        const cardRef = db.collection('creditcards').doc(cardId);
        const txRef = cardRef.collection('transactions').doc(transactionId);

        await db.runTransaction(async (transaction) => {
            const cardDoc = await transaction.get(cardRef);
            const txDoc = await transaction.get(txRef);

            if (!cardDoc.exists || !txDoc.exists) throw new Error("Not found");

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
        revalidatePath(`/creditcard/${cardId}`);
        return { success: true };
    } catch (e) {
        console.error('Delete Transaction Error:', e);
        return { success: false, message: 'Failed to delete transaction' };
    }
}

export async function getUserProfile() {
    try {
        const session = await getSession();
        if (!session) return null;

        const doc = await db.collection('users').doc(session.uid).get();
        if (doc.exists) {
            return { ...doc.data(), uid: doc.id };
        }

        // Fallback to session info (from token/updateProfile)
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
