import { db } from '@/lib/firebase-admin';
import { getSession } from '@/app/actions/authActions';
import DashboardTrendChart from '@/app/components/DashboardTrendChart';
import LoanProgressWidget from '@/app/components/LoanProgressWidget';
import UpcomingPaymentsList from '@/app/components/UpcomingPaymentsList';
import TopSubscriptionsWidget from '@/app/components/TopSubscriptionsWidget';
import Greeting from '@/app/components/Greeting';
import { cache } from 'react';

const getDashboardData = cache(async function getDashboardData(userId) {
    if (!userId) return {
        totalMonthlyOutflow: 0,
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

    // 1. Fetch Subscriptions
    const subSnapshot = await db.collection('subscriptions').where('userId', '==', userId).get();
    const subscriptions = subSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. Fetch Loans
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

    // --- Metrics Calculations (Unchanged) ---
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

    // --- Upcoming Payments ---
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

    // Subs
    activeSubs.forEach(sub => {
        if (!sub.nextRenewalDate) return;
        const date = sub.nextRenewalDate.toDate ? sub.nextRenewalDate.toDate() : new Date(sub.nextRenewalDate);

        // Sum upcoming if in current month or next 30 days
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

    // Loans
    let nextDueLoan = null;
    activeLoans.forEach(loan => {
        const schedule = loan.schedule || [];
        const payments = loan.payments || {};
        const nextEMI = schedule.find(emi => !payments[emi.date]);

        if (nextEMI) {
            const emiDate = new Date(nextEMI.date);
            // Nearest loan logic
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

    // --- Trends Mockup Data (Simulated for Demo) ---
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const trendData = months.map((m, i) => ({
        month: m,
        amount: Math.floor(totalMonthlySubSpend * (0.8 + Math.random() * 0.4))
    }));
    // Trend for current month
    trendData[5].amount = Math.round(totalMonthlySubSpend);


    return {
        totalMonthlyOutflow: totalMonthlySubSpend + totalMonthlyLoanEMI,
        upcomingTotalAmount: upcomingTotalAmount > 0 ? upcomingTotalAmount : upcomingPayments.reduce((a, b) => a + b.amount, 0) || 0, // Fallback
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

export default async function DashboardPage() {
    const session = await getSession();
    const data = await getDashboardData(session?.uid);

    const firstName = session?.name ? session.name.split(' ')[0] : 'there';
    const currentMonthName = new Date().toLocaleDateString('en-GB', { month: 'short' });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <main className="max-w-7xl mx-auto space-y-8 min-h-screen">
            {/* Header */}
            <div>
                <Greeting name={firstName} />
                <p className="text-gray-500 mt-1">Here's what's happening with your money today.</p>
            </div>

            {/* Row 1: Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Total Outflow */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Total Monthly Outflow</p>
                        <h2 className="text-3xl font-extrabold text-gray-900">{formatCurrency(data.totalMonthlyOutflow)}</h2>
                    </div>
                    <p className="text-xs font-medium text-emerald-600 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
                        4.2% less than last month
                    </p>
                </div>

                {/* 2. Upcoming Payments */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Upcoming Payments ({currentMonthName})</p>
                        <h2 className="text-3xl font-extrabold text-gray-900">{formatCurrency(data.upcomingTotalAmount || 0)}</h2>
                    </div>
                    <p className="text-xs font-medium text-orange-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {data.paymentsDueThisWeek} payments due this week
                    </p>
                </div>

                {/* 3. Active Subs */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Active Subscriptions</p>
                        <h2 className="text-3xl font-extrabold text-gray-900">{data.activeSubsCount}</h2>
                    </div>
                    <p className="text-xs text-gray-400">
                        {formatCurrency(data.avgSubCost)}/month average
                    </p>
                </div>

                {/* 4. Active Loans */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-40">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Active Loans/EMIs</p>
                        <h2 className="text-3xl font-extrabold text-gray-900">{data.activeLoansCount}</h2>
                    </div>
                    <p className="text-xs text-gray-400">
                        Next due in {data.nextDueLoan ? Math.ceil((new Date(data.nextDueLoan.date) - new Date()) / (86400000)) : '-'} days
                    </p>
                </div>
            </div>

            {/* Row 2: Charts & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[400px]">
                {/* Trend Chart (2/3 width) */}
                <div className="lg:col-span-2 h-full">
                    <DashboardTrendChart data={data.trendData} />
                </div>
                {/* Loan Progress (1/3 width) */}
                <div className="h-full">
                    <LoanProgressWidget
                        totalLoanAmount={data.totalLoanAmount}
                        totalPaid={data.totalLoanPaid}
                        activeLoansCount={data.activeLoansCount}
                        nextDueLoan={data.nextDueLoan}
                    />
                </div>
            </div>

            {/* Row 3: Upcoming Payments & Top Subs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming List (2/3 width) */}
                <div className="lg:col-span-2">
                    <UpcomingPaymentsList items={data.upcomingPayments} />
                </div>
                {/* Top Subs (1/3 width) */}
                <div>
                    <TopSubscriptionsWidget subscriptions={data.topSubscriptions} />
                </div>
            </div>

        </main>
    );
}
