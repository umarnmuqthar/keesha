import { getSession } from '@/app/actions/authActions';
import { redirect } from 'next/navigation';
import UpcomingPaymentsList from '@/app/components/UpcomingPaymentsList';
import PageHeaderActions from '@/app/components/PageHeaderActions';
import { getDashboardData } from '../dashboard-data';

export default async function UpcomingPaymentsPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const data = await getDashboardData(session.uid);

    return (
        <main className="min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeaderActions
                    title="Upcoming Payments"
                    subtitle="All upcoming subscription renewals and EMI dues."
                />
                <UpcomingPaymentsList items={data.upcomingPayments} hideLink />
            </div>
        </main>
    );
}
