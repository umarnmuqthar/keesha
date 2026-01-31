
/**
 * Keesha Logic Library
 * Core calculations for Subscription Management
 */

/**
 * Calculate days until the next renewal date.
 * @param {Date|string} nextRenewalDate 
 * @returns {number} Days remaining (positive) or days overdue (negative)
 */
export function calculateDaysUntilDue(nextRenewalDate) {
  if (!nextRenewalDate) return 0;
  const now = new Date();
  const due = new Date(nextRenewalDate);

  // Reset time part to ensure we count full days
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate the projected yearly cost based on billing cycle.
 * @param {number} cost - Current cost of subscription
 * @param {string} cycle - 'Monthly' or 'Yearly'
 * @returns {number} Projected yearly cost
 */
export function calculateProjectedYearlyCost(cost, cycle) {
  if (!cost) return 0;
  if (cycle === 'Yearly') return cost;
  if (cycle === 'Monthly') return cost * 12;
  if (cycle === 'Quarterly') return cost * 4;
  return cost; // Default fallback
}

/**
 * Calculate the amortized monthly cost.
 * @param {number} cost - Current cost of subscription
 * @param {string} cycle - 'Monthly' or 'Yearly'
 * @returns {number} Monthly equivalent cost
 */
export function calculateAmortizedMonthlyCost(cost, cycle) {
  if (!cost) return 0;
  if (cycle === 'Monthly') return cost;
  if (cycle === 'Yearly') return cost / 12;
  if (cycle === 'Quarterly') return cost / 3;
  return cost;
}

/**
 * Calculate total lifetime spend from the ledger.
 * @param {Array} ledger - Array of transaction objects { amount: number }
 * @returns {number} Total spend
 */
export function calculateLifetimeSpend(ledger) {
  if (!ledger || !Array.isArray(ledger)) return 0;
  return ledger.reduce((total, transaction) => total + (transaction.amount || 0), 0);
}

/**
 * Generate insights and alerts for a subscription.
 * @param {Object} subscription - Full subscription object
 * @returns {Object} Insights object { alerts: [], badge: string }
 */
export function getSubscriptionInsights(subscription) {
  const alerts = [];
  const daysUntilDue = calculateDaysUntilDue(subscription.nextRenewalDate);

  // Free Trial Guard
  if (subscription.status === 'Free Trial' && daysUntilDue < 3 && daysUntilDue >= 0) {
    alerts.push({
      type: 'CRITICAL',
      message: 'CANCEL NOW'
    });
  }

  // Auto-Pay Watchdog
  if (subscription.billingCycle === 'Yearly' && subscription.autoPayActive && daysUntilDue < 14 && daysUntilDue >= 0) {
    alerts.push({
      type: 'WARNING',
      message: 'Review before payment'
    });
  }

  // Cost Insights Badge
  const yearlyCost = calculateProjectedYearlyCost(subscription.currentCost, subscription.billingCycle);
  const badge = `You spend ₹${yearlyCost.toLocaleString()}/year on this`;

  return { alerts, badge };
}
