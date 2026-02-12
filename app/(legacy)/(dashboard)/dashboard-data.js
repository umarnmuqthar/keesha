import { db } from '@/lib/firebase-admin';
import { cache } from 'react';

export const getDashboardData = cache(async function getDashboardData(userId) {
    if (!userId) return {
        totalMonthlyOutflow: 0,
        totalMonthlySubSpend: 0,
        totalMonthlyLoanEMI: 0,
        upcomingTotalAmount: 0,
        paymentsDueThisWeek: 0,
        activeSubsCount: 0,
        avgSubCost: 0,
        activeLoansCount: 0,
        nextDueLoan: null,
        totalLoanAmount: 0,
        totalLoanPaid: 0,
        trendData: [],
        upcomingPayments: [],
        topSubscriptions: []
    };

    const subSnapshot = await db.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let loans = [];
    try {
        const loanSnapshot = await db.collection('loans').where('userId', '==', userId).get();
        const baseLoans = loanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        loans = await Promise.all(baseLoans.map(async (loan) => {
            const paymentsSnapshot = await db.collection('loans').doc(loan.id).collection('payments').get();
            let paidAmount = 0;
            const payments = {};
            paymentsSnapshot.forEach(pDoc => {
                const pData = pDoc.data();
                paidAmount += parseFloat(pData.amount || 0);
                payments[pDoc.id] = pData;
            });
            return { ...loan, payments, totalPaid: paidAmount };
        }));
    } catch (e) {
        console.error("Error fetching loans:", e);
        loans = [];
    }

    const activeSubs = subscriptions.filter(s => s.status === 'Active');
    const totalMonthlySubSpend = activeSubs.reduce((acc, sub) => {
        let monthlyCost = sub.currentCost;
        if (sub.billingCycle === 'Yearly') monthlyCost = sub.currentCost / 12;
        if (sub.billingCycle === 'Quarterly') monthlyCost = sub.currentCost / 3;
        return acc + monthlyCost;
    }, 0);

    const activeLoans = loans.filter(l => (l.status || 'Active') === 'Active');
    const totalMonthlyLoanEMI = activeLoans.reduce((acc, loan) => acc + (parseFloat(loan.emiAmount) || 0), 0);

    const totalLoanAmount = activeLoans.reduce((acc, loan) => acc + (parseFloat(loan.totalPayable) || 0), 0);
    const totalLoanPaid = activeLoans.reduce((acc, loan) => acc + (parseFloat(loan.totalPaid) || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    const weekEnd = new Date();
    weekEnd.setDate(today.getDate() + 7);

    let upcomingPayments = [];
    let paymentsDueThisWeek = 0;
    let upcomingTotalAmount = 0;
    const currentMonthIndex = new Date().getMonth();

    activeSubs.forEach(sub => {
        if (!sub.nextRenewalDate) return;
        const date = sub.nextRenewalDate.toDate ? sub.nextRenewalDate.toDate() : new Date(sub.nextRenewalDate);

        if (date >= today && date <= next30Days) {
            upcomingPayments.push({
                uid: `sub-${sub.id}-${date.getTime()}`,
                id: sub.id,
                name: sub.name,
                type: 'subscription',
                category: sub.category,
                date: date.toISOString(),
                amount: sub.currentCost
            });

            if (date.getMonth() === currentMonthIndex) {
                upcomingTotalAmount += sub.currentCost;
            }

            if (date <= weekEnd) paymentsDueThisWeek++;
        }
    });

    let nextDueLoan = null;
    activeLoans.forEach(loan => {
        const schedule = loan.schedule || [];
        const payments = loan.payments || {};
        const nextEMI = schedule.find(emi => !payments[emi.date]);

        if (nextEMI) {
            const emiDate = new Date(nextEMI.date);
            if (!nextDueLoan || emiDate < new Date(nextDueLoan.date)) {
                nextDueLoan = { ...nextEMI, name: loan.name };
            }

            if (emiDate >= today && emiDate <= next30Days) {
                upcomingPayments.push({
                    uid: `loan-${loan.id}-${nextEMI.date}`,
                    id: loan.id,
                    name: loan.name,
                    type: 'loan',
                    category: 'Loan Repayment',
                    date: nextEMI.date,
                    amount: nextEMI.amount
                });

                if (emiDate.getMonth() === currentMonthIndex) {
                    upcomingTotalAmount += nextEMI.amount;
                }

                if (emiDate <= weekEnd) paymentsDueThisWeek++;
            }
        }
    });

    upcomingPayments.sort((a, b) => new Date(a.date) - new Date(b.date));

    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const trendData = months.map((m) => ({
        month: m,
        amount: Math.floor(totalMonthlySubSpend * (0.8 + Math.random() * 0.4))
    }));
    trendData[5].amount = Math.round(totalMonthlySubSpend);

    return {
        totalMonthlyOutflow: totalMonthlySubSpend + totalMonthlyLoanEMI,
        totalMonthlySubSpend,
        totalMonthlyLoanEMI,
        upcomingTotalAmount: upcomingTotalAmount > 0 ? upcomingTotalAmount : upcomingPayments.reduce((a, b) => a + b.amount, 0) || 0,
        paymentsDueThisWeek,
        activeSubsCount: activeSubs.length,
        avgSubCost: Math.round(totalMonthlySubSpend / (activeSubs.length || 1)),
        activeLoansCount: activeLoans.length,
        nextDueLoan,
        totalLoanAmount,
        totalLoanPaid,
        trendData,
        upcomingPayments,
        topSubscriptions: activeSubs.sort((a, b) => b.currentCost - a.currentCost)
    };
});
