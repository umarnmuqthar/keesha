'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { useShellSearch } from '@/components/layout/ShellSearchContext';
import { AddButton, Card } from '@/components/ui';
import { useModalState } from '@/components/ui/useModalState';
import AddCreditCardModal from '@/features/legacy/components/AddCreditCardModal';
import shellStyles from '../app-shell.module.css';
import styles from './creditcards.module.css';

type CardItem = {
  id: string;
  name?: string;
  brand?: string;
  totalLimit?: number;
  statementBalance?: number;
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
  const { query: searchQuery } = useShellSearch();
  const query = searchQuery.trim().toLowerCase();
  const totalLimit = cards.reduce((sum, card) => sum + Number(card.totalLimit || 0), 0);
  const totalDue = cards.reduce((sum, card) => sum + Number(card.statementBalance || 0), 0);
  const filteredCards = useMemo(() => {
    if (!query) return cards;
    return cards.filter((card) =>
      [card.name, card.brand]
        .map((value) => String(value || '').toLowerCase())
        .some((value) => value.includes(query))
    );
  }, [cards, query]);

  return (
    <>
      <AppShell
        sidebar={<Sidebar />}
        header={
          <div className={shellStyles.header}>
            <div>
              <p className={shellStyles.eyebrow}>Credit Cards</p>
              <h1>Card utilization</h1>
            </div>
            <div className={shellStyles.headerActions}>
              <AddButton size="sm" onClick={modal.open}>Add card</AddButton>
            </div>
          </div>
        }
      >
        <div className={styles.page}>
          <section className={styles.hero}>
            <div>
              <h2>Manage card utilization smartly</h2>
              <p>Keep limits, billing cycles, and due amounts under control.</p>
            </div>
            <div className={styles.heroStats}>
              <Card className={styles.statCard}>
                <p className={styles.label}>Active cards</p>
                <h3>{cards.length}</h3>
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
              filteredCards.map((card) => (
                <Link key={card.id} href={`/creditcards/${card.id}`} className={styles.itemLink}>
                  <Card className={styles.item}>
                    <div>
                      <h3>{card.name || 'Credit Card'}</h3>
                      <p>{card.brand || 'Card'}</p>
                    </div>
                    <div className={styles.itemMeta}>
                      <span>Limit {formatAmount(card.totalLimit)}</span>
                      <strong>{formatAmount(card.statementBalance || 0)}</strong>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </section>
        </div>
      </AppShell>

      <AddCreditCardModal isOpen={modal.isOpen} onClose={modal.close} />
    </>
  );
}
