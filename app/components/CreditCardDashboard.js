'use client';

import React, { useState } from 'react';
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react';
import CreditCardItem from './CreditCardItem';
import AddCreditCardModal from './AddCreditCardModal';
import styles from './CreditCardDashboard.module.css';

import PageHeader from './PageHeader';

export default function CreditCardDashboard({ cards = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={styles.container}>
            <PageHeader
                title="Credit Cards"
                subtitle="Monitor your credit card limits and statement cycles."
                actionLabel="Add New Card"
                onAction={() => setIsModalOpen(true)}
            />

            {cards.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <CreditCardIcon size={32} />
                    </div>
                    <div className={styles.emptyText}>
                        <h3>No cards found</h3>
                        <p>Add your first card to start tracking everything money touches.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                        <Plus size={20} /> Add Your First Card
                    </button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {cards.map(card => (
                        <CreditCardItem key={card.id} card={card} />
                    ))}
                </div>
            )}

            <AddCreditCardModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
