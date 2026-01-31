/**
 * Generates an initial payment schedule based on loan terms.
 */
export function generatePaymentSchedule(startDateStr, tenureMonths, emiAmount, dueDateDay) {
    const schedule = [];

    // Manually parse YYYY-MM to avoid UTC timezone shifts
    const parts = startDateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]); // 1-based
    const day = parseInt(dueDateDay);

    for (let i = 0; i < tenureMonths; i++) {
        // Create a date for the first of the target month to avoid overflow issues
        const baseDate = new Date(year, (month - 1) + i, 1);
        const y = baseDate.getFullYear();
        const m = baseDate.getMonth();

        // Find the last day of this specific month
        const lastDayOfMonth = new Date(y, m + 1, 0).getDate();

        // Cap the day to the month's maximum days (e.g., 31 -> 30 for November)
        const finalDay = Math.min(day, lastDayOfMonth);
        const paymentDate = new Date(y, m, finalDay);

        // Construct YYYY-MM-DD string manually to avoid timezone/UTC issues
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        schedule.push({
            id: `p-${i}-${Date.now()}`,
            date: dateStr,
            amount: parseFloat(emiAmount),
            isPaid: paymentDate < today
        });
    }

    return schedule;
}

/**
 * Formats a YYYY-MM-DD date string into "DD MMM YYYY"
 */
export function formatScheduleDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).replace(/ /g, ' '); // Ensure single space
}

/**
 * Calculates a simple Internal Rate of Return (IRR) for the loan.
 * Since this is a browser-side/simple tool, we use a basic estimation
 * or a Newton-Raphson approach for fixed monthly payments.
 */
export function calculateEffectiveInterestRate(creditedAmount, payments, processingFee = 0) {
    const principal = parseFloat(creditedAmount) - parseFloat(processingFee);
    if (principal <= 0) return 0;

    // Total amount the user will pay back
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // The actual cost is what you pay back minus what you actually received in hand
    const totalInterest = totalPaid - principal;

    // Estimate length in years
    const years = payments.length / 12;
    if (years <= 0) return 0;

    // Calculate effective annual flat rate based on net principal received
    const flatRate = (totalInterest / principal) / years * 100;

    return flatRate.toFixed(2);
}

/**
 * Provides financial advice based on the effective interest rate.
 */
export function getLoanAdvice(rate) {
    const r = parseFloat(rate);
    if (r < 8) return { text: "Excellent! This is a very low-interest loan.", color: "var(--success)" };
    if (r < 12) return { text: "Good. This rate is competitive for most personal/auto loans.", color: "var(--primary)" };
    if (r < 16) return { text: "Fair. You might find better rates, but this is standard for some products.", color: "var(--warning)" };
    return { text: "Expensive. Consider if there are other options or plan to prepay if possible.", color: "var(--danger)" };
}
