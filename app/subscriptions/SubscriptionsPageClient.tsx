'use client';

import { useMemo, useState } from "react";
import { useShellSearch } from "@/components/layout/ShellSearchContext";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageHeader, TabButton, ActionButton } from "@/components/layout/PageHeader";
import { AddButton, Card } from "@/components/ui";
import { useModalState } from "@/components/ui/useModalState";
import AddSubscriptionModal from "@/features/legacy/components/AddSubscriptionModal";
import SubscriptionDetailsModal from "./SubscriptionDetailsModal";
import styles from "./subscriptions.module.css";
import { Filter, LayoutDashboard } from "lucide-react";

type Subscription = {
  id: string;
  name?: string;
  category?: string;
  status?: string;
  billingCycle?: string;
  paymentMethod?: string;
  cycle?: string;
  currentCost?: number;
  amount?: number | string;
  startDate?: string;
  nextRenewalDate?: string;
  lastPaymentDate?: string;
  createdAt?: string;
  ledger?: any[];
};

type SubscriptionsPageClientProps = {
  subscriptions: Subscription[];
};

const toNumber = (value: unknown) => {
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getCycle = (sub: Subscription) => {
  return String(sub?.billingCycle || sub?.cycle || "Monthly");
};

const getSubscriptionAmount = (sub: Subscription) => {
  return toNumber(sub?.currentCost ?? sub?.amount ?? 0);
};

const getAnnualAmount = (amount: number, billingCycle?: string) => {
  const cycle = String(billingCycle || "Monthly").toLowerCase();
  if (cycle === "yearly") return amount;
  if (cycle === "quarterly") return amount * 4;
  return amount * 12;
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const getAvatarStyle = (name?: string) => {
  if (!name) return { bg: 'linear-gradient(135deg, #e6f4f1 0%, #f6f4f0 100%)', color: '#0f766e' };
  
  const gradients = [
    { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', color: '#dc2626' }, // Rose/Red
    { bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', color: '#0284c7' }, // Blue
    { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', color: '#15803d' }, // Green
    { bg: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', color: '#a16207' }, // Yellow/Gold
    { bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', color: '#7e22ce' }, // Purple
    { bg: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', color: '#c2410c' }, // Orange
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function SubscriptionsPageClient({ subscriptions }: SubscriptionsPageClientProps) {
  const modal = useModalState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Cancelled' | 'All'>('Active');
  const { query: searchQuery } = useShellSearch();

  const monthShort = new Date().toLocaleDateString("en-GB", { month: "short" });

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'All') return subscriptions;
    return subscriptions.filter(sub => (sub.status || 'Active') === statusFilter);
  }, [subscriptions, statusFilter]);

  const filteredSubscriptions = useMemo(() => {
    if (!searchQuery) return filteredByStatus;
    const q = searchQuery.toLowerCase();
    return filteredByStatus.filter(sub => 
      (sub.name || "").toLowerCase().includes(q) || 
      (sub.category || "").toLowerCase().includes(q)
    );
  }, [filteredByStatus, searchQuery]);

  const activeSubscriptions = subscriptions.filter((sub) => {
    const status = String(sub?.status || "").toLowerCase();
    return status === "active" || status === "free trial" || status === "";
  });

  const yearlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const amount = getSubscriptionAmount(sub);
    return sum + getAnnualAmount(amount, getCycle(sub));
  }, 0);

  const monthlyOutflow = yearlyTotal / 12;
  const existingNames = subscriptions.map((sub) => sub.name || "").filter(Boolean);

  const openSubDetails = (sub: Subscription) => {
    setSelectedSub(sub);
  };

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <PageHeader
            title=""
            showSearch={true}
            tabs={
              <>
                {(['Active', 'Cancelled', 'All'] as const).map(status => (
                  <TabButton
                    key={status}
                    active={statusFilter === status}
                    onClick={() => {
                      setStatusFilter(status);
                      setViewMode('list');
                    }}
                  >
                    {status}
                  </TabButton>
                ))}
              </>
            }
            filters={
              <ActionButton
                active={viewMode === 'dashboard'}
                onClick={() => setViewMode(prev => prev === 'dashboard' ? 'list' : 'dashboard')}
                title="Toggle Dashboard"
              >
                <LayoutDashboard size={16} />
              </ActionButton>
            }
            actions={<AddButton size="sm" onClick={modal.open}>Add subscription</AddButton>}
          />
        }
      >
        <div className={styles.page}>
          {viewMode === 'dashboard' && (
            <section className={styles.hero}>
              <div className={styles.heroStats}>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Active</p>
                  <h3>{activeSubscriptions.length}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Yearly Total</p>
                  <h3>₹{yearlyTotal.toLocaleString("en-IN")}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Monthly Outflow ({monthShort})</p>
                  <h3>₹{Math.round(monthlyOutflow).toLocaleString("en-IN")}</h3>
                </Card>
              </div>
            </section>
          )}

          {viewMode === 'list' && (
            <section className={styles.list}>
              {filteredSubscriptions.length === 0 ? (
                <Card className={styles.empty}>
                  <h3>No subscriptions found</h3>
                  <p>Try adjusting your filters or search query.</p>
                  <AddButton size="sm" onClick={modal.open}>Add subscription</AddButton>
                </Card>
              ) : (
                <>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.nameCell}>Subscription</th>
                          <th>Billing cycle</th>
                          <th className={styles.amountCell}>Amount</th>
                          <th className={styles.statusCell}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscriptions.map((sub) => (
                          <tr 
                            key={sub.id} 
                            className={styles.tableRow}
                            onClick={() => openSubDetails(sub)}
                          >
                            <td className={styles.nameCell}>
                              <div className={styles.subInfo}>
                                <strong>{sub.name || "Subscription"}</strong>
                                <span className={styles.categoryText}>{sub.category || "Uncategorized"}</span>
                              </div>
                            </td>
                            <td className={styles.cycleCell}>{getCycle(sub)}</td>
                            <td className={styles.amountCell}>
                              ₹{getSubscriptionAmount(sub).toLocaleString("en-IN")}
                            </td>
                            <td className={styles.statusCell}>
                              <span className={`
                                ${styles.statusBadge} 
                                ${(sub.status || 'Active') === 'Active' ? styles.statusActive : styles.statusCancelled}
                              `}>
                                {sub.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.mobileList}>
                    {filteredSubscriptions.map((sub) => {
                      const initials = getInitials(sub.name || 'Subscription');
                      const avatarStyle = getAvatarStyle(sub.name || 'Subscription');
                      const cycle = getCycle(sub);

                      return (
                        <div 
                          key={sub.id} 
                          className={styles.mobileCard}
                          onClick={() => openSubDetails(sub)}
                        >
                          <div className={styles.mobileCardLeft}>
                            <div 
                              className={styles.avatar}
                              style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                            >
                              {initials}
                            </div>
                            <div className={styles.mobileCardInfo}>
                              <span className={styles.mobileCardName}>
                                {sub.name || "Subscription"}
                              </span>
                              <div className={styles.mobileCardSubtitle}>
                                <span className={styles.mobileCardCat}>{sub.category || "Uncategorized"}</span>
                                <span className={styles.dot}>•</span>
                                <span className={styles.mobileCardCycle}>{cycle}</span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.mobileCardRight}>
                            <span className={styles.mobileCardAmount}>
                              ₹{getSubscriptionAmount(sub).toLocaleString("en-IN")}
                            </span>
                            <span className={`
                              ${styles.statusBadge} 
                              ${(sub.status || 'Active') === 'Active' ? styles.statusActive : styles.statusCancelled}
                            `}>
                              {sub.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </AppShell>

      <SubscriptionDetailsModal
        subscription={selectedSub}
        onClose={() => setSelectedSub(null)}
      />

      <AddSubscriptionModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        existingNames={existingNames as any}
        style={{}}
      />
    </>
  );
}
