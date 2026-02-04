import { getSession } from '@/app/actions/authActions';
import DashboardTrendChart from '@/app/components/DashboardTrendChart';
import LoanProgressWidget from '@/app/components/LoanProgressWidget';
import UpcomingPaymentsList from '@/app/components/UpcomingPaymentsList';
import Greeting from '@/app/components/Greeting';
import styles from './DashboardPage.module.css';
import { CalendarCheck, Layers, TrendingDown } from 'lucide-react';
import { getDashboardData } from './dashboard-data';

export default async function DashboardPage() {
    const session = await getSession();
    const data = await getDashboardData(session?.uid);

    const firstName = session?.name ? session.name.split(' ')[0] : 'there';
    const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'short' });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const nextDueDays = data.nextDueLoan ? Math.ceil((new Date(data.nextDueLoan.date) - new Date()) / 86400000) : null;

    return (
        <main className={styles.page}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <Greeting name={firstName} />
                    <p className={styles.heroSubtext}>Here's what's happening with your money today.</p>
                    <div className={styles.heroAmount}>{formatCurrency(data.totalMonthlyOutflow)}</div>
                    <div className={styles.heroMeta}>
                        <span className={styles.heroChip}>Subscriptions + EMIs</span>
                        <span className={styles.heroChip}>{data.paymentsDueThisWeek} due this week</span>
                    </div>
                </div>
                <div className={styles.heroHighlights}>
                    <div className={styles.highlightCard}>
                        <span className={styles.highlightLabel}>Upcoming ({currentMonthName})</span>
                        <span className={styles.highlightValue}>{formatCurrency(data.upcomingTotalAmount || 0)}</span>
                        <span className={styles.highlightMeta}>{data.upcomingPayments.length} upcoming payments</span>
                    </div>
                    <div className={styles.highlightCard}>
                        <span className={styles.highlightLabel}>Active Subscriptions</span>
                        <span className={styles.highlightValue}>{data.activeSubsCount}</span>
                        <span className={styles.highlightMeta}>{formatCurrency(data.avgSubCost)}/month avg</span>
                    </div>
                    <div className={styles.highlightCard}>
                        <span className={styles.highlightLabel}>Active Loans</span>
                        <span className={styles.highlightValue}>{data.activeLoansCount}</span>
                        <span className={styles.highlightMeta}>
                            Next due {nextDueDays !== null ? `in ${nextDueDays} days` : '-'}
                        </span>
                    </div>
                    <div className={styles.highlightCard}>
                        <span className={styles.highlightLabel}>Loan EMI Total</span>
                        <span className={styles.highlightValue}>{formatCurrency(data.totalMonthlyLoanEMI)}</span>
                        <span className={styles.highlightMeta}>Monthly commitment</span>
                    </div>
                </div>
            </section>

            <div className={styles.insightRow}>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Insights</span>
                        <CalendarCheck size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span>Upcoming payments</span>
                            <span className={styles.insightValue}>{data.upcomingPayments.length}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span>Active subscriptions</span>
                            <span className={styles.insightValue}>{data.activeSubsCount}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span>Active loans</span>
                            <span className={styles.insightValue}>{data.activeLoansCount}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.insightCard}>
                    <div className={styles.insightHeader}>
                        <span>Breakdown</span>
                        <TrendingDown size={16} />
                    </div>
                    <div className={styles.insightItems}>
                        <div className={styles.insightItem}>
                            <span>Subscription spend</span>
                            <span className={styles.insightValue}>{formatCurrency(data.totalMonthlySubSpend)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span>Monthly loan EMI</span>
                            <span className={styles.insightValue}>{formatCurrency(data.totalMonthlyLoanEMI)}</span>
                        </div>
                        <div className={styles.insightItem}>
                            <span>Total loan paid</span>
                            <span className={styles.insightValue}>{formatCurrency(data.totalLoanPaid)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.gridRowTall}>
                <div>
                    <DashboardTrendChart data={data.trendData} />
                </div>
                <div>
                    <LoanProgressWidget
                        totalLoanAmount={data.totalLoanAmount}
                        totalPaid={data.totalLoanPaid}
                        activeLoansCount={data.activeLoansCount}
                        nextDueLoan={data.nextDueLoan}
                    />
                </div>
            </div>

            <div className={styles.gridRow}>
                <div>
                    <UpcomingPaymentsList items={data.upcomingPayments} />
                </div>
            </div>
        </main>
    );
}
