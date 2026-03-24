'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageHeader, TabButton, ActionButton } from '@/components/layout/PageHeader';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddCreditCardModal from '@/features/legacy/components/AddCreditCardModal';
import CreditCardDetailsModal from './CreditCardDetailsModal';
import { Filter, LayoutDashboard } from 'lucide-react';
import styles from './creditcards.module.css';

type CardItem = {
  id: string;
  name?: string;
  brand?: string;
  number?: string;
  totalLimit?: number;
  statementBalance?: number;
  totalPaid?: number;
  dueDate?: string;
  status?: string;
  transactions?: any[];
};

type CreditCardsPageClientProps = {
  cards: CardItem[];
};

const formatAmount = (value?: number) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
};

export default function CreditCardsPageClient({ cards }: CreditCardsPageClientProps) {
  const modal = useModalState(false);
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'All'>('Active');
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'All') return cards;
    return cards.filter(card => (card.status || 'Active') === statusFilter);
  }, [cards, statusFilter]);

  const filteredCards = useMemo(() => {
    if (!query) return filteredByStatus;
    return filteredByStatus.filter((card) =>
      (card.name || '').toLowerCase().includes(query) ||
      (card.brand || '').toLowerCase().includes(query)
    );
  }, [filteredByStatus, query]);

  const totalLimit = cards.reduce((sum, card) => sum + Number(card.totalLimit || 0), 0);
  const totalDue = cards.reduce((sum, card) => {
    const remaining = Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0));
    return sum + remaining;
  }, 0);

  const openCardDetails = (card: CardItem) => {
    setSelectedCard(card);
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
                {(['Active', 'Inactive', 'All'] as const).map(status => (
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
            actions={<AddButton size="sm" onClick={modal.open}>Add card</AddButton>}
          />
        }
      >
        <div className={styles.page}>
          {viewMode === 'dashboard' && (
            <section className={styles.hero}>
              <div className={styles.heroStats}>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Active cards</p>
                  <h3>{cards.filter(c => (c.status || 'Active') === 'Active').length}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Outstanding due</p>
                  <h3>{formatAmount(totalDue)}</h3>
                </Card>
                <Card className={styles.statCard}>
                  <p className={styles.label}>Combined limit</p>
                  <h3>{formatAmount(totalLimit)}</h3>
                </Card>
              </div>
            </section>
          )}

          {viewMode === 'list' && (
            <section className={styles.list}>
              {filteredCards.length === 0 ? (
                <Card className={styles.placeholder}>
                  <h3>{query ? 'No matching cards' : 'No credit cards yet'}</h3>
                  <p>
                    {query
                      ? `No card found for "${searchQuery}".`
                      : 'Add your cards to track limits, due dates, and utilization.'}
                  </p>
                  {!query ? <AddButton size="sm" onClick={modal.open}>Add card</AddButton> : null}
                </Card>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.nameCell}>Card Name</th>
                        <th>Brand</th>
                        <th className={styles.amountCell}>Remaining Due</th>
                        <th className={styles.amountCell}>Credit Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map((card) => {
                        const remainingDue = Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0));
                        return (
                          <tr 
                            key={card.id} 
                            className={styles.tableRow}
                            onClick={() => openCardDetails(card)}
                          >
                            <td className={styles.nameCell}>
                              <div className={styles.cardInfo}>
                                <strong>{card.name || "Credit Card"}</strong>
                                <span className={styles.cardNumber}>•••• {String(card.number || "").slice(-4)}</span>
                              </div>
                            </td>
                            <td>{card.brand || "Card"}</td>
                            <td className={`${styles.amountCell} ${remainingDue > 0 ? styles.dueText : ''}`}>
                              {formatAmount(remainingDue)}
                            </td>
                            <td className={styles.amountCell}>
                              {formatAmount(card.totalLimit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </AppShell>

      <CreditCardDetailsModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />

      <AddCreditCardModal isOpen={modal.isOpen} onClose={modal.close} />
    </>
  );
}
