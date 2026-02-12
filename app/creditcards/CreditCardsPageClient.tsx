'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
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
  const totalLimit = cards.reduce((sum, card) => sum + Number(card.totalLimit || 0), 0);
  const totalDue = cards.reduce((sum, card) => sum + Number(card.statementBalance || 0), 0);

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
            {cards.length === 0 ? (
              <Card className={styles.placeholder}>
                <h3>No credit cards yet</h3>
                <p>Add your cards to track limits, due dates, and utilization.</p>
                <AddButton size="sm" onClick={modal.open}>Add card</AddButton>
              </Card>
            ) : (
              cards.map((card) => (
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
