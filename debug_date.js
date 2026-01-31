const startDateStr = "2026-01-21";
const startDate = new Date(startDateStr);
console.log("Start Date:", startDate.toISOString());

const duration = 3;
let endDate = new Date(startDate);

// Simulate the logic
endDate.setMonth(endDate.getMonth() + duration);
console.log("End Date (Standard setMonth):", endDate.toISOString());

// Check for edge cases
const startDate2 = new Date("2026-01-01");
const endDate2 = new Date(startDate2);
endDate2.setMonth(endDate2.getMonth() + 3);
console.log("End Date (From Jan 1):", endDate2.toISOString());
