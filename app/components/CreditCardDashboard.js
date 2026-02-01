'use client';

import React, { useState } from 'react';
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react';
import CreditCardItem from './CreditCardItem';
import AddCreditCardModal from './AddCreditCardModal';
import PageHeaderActions from './PageHeaderActions';

export default function CreditCardDashboard({ cards = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Active');

    const filteredCards = cards.filter(card => {
        const matchesSearch =
            (card.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (card.brand || '').toLowerCase().includes(searchQuery.toLowerCase());

        const remainingDue = Math.max(0, (card.statementBalance || 0) - (card.totalPaid || 0));
        const matchesTab = activeTab === 'All' ||
            (activeTab === 'Active' && remainingDue > 0) ||
            (activeTab === 'Inactive' && remainingDue === 0);

        return matchesSearch && matchesTab;
    });

    return (
        <div className={styles.container}>
            <PageHeaderActions
                title="Credit Cards"
                subtitle="Track your card balances and statement cycles."
                actionLabel="Add Card"
                onAction={() => setIsModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search cards..."
                tabs={['Active', 'Inactive', 'All']}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {filteredCards.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <CreditCardIcon size={32} />
                    </div>
                    <div className={styles.emptyText}>
                        <h3>{searchQuery ? 'No cards found' : 'No cards found'}</h3>
                        <p>{searchQuery ? `No cards matching "${searchQuery}"` : 'Add your first card to start tracking everything money touches.'}</p>
                    </div>
                    {!searchQuery && (
                        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                            <Plus size={20} /> Add Your First Card
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredCards.map(card => (
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
