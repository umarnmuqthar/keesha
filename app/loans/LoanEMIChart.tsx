'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import styles from './loans.module.css';

type Loan = {
  id: string;
  name?: string;
  schedule?: { date?: string; amount?: number }[];
  payments?: Record<string, any>;
  emiAmount?: number;
  monthlyEmi?: number;
  status?: string;
};

type ChartDataPoint = {
  monthKey: string;
  label: string;
  paid: number;
  upcoming: number;
  total: number;
  isCurrent: boolean;
};

type LoanEMIChartProps = {
  loans: Loan[];
};

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString('en-IN')}`;
};

const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (date: Date) => {
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
};

export default function LoanEMIChart({ loans }: LoanEMIChartProps) {
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const now = new Date();
    const currentMonthKey = getMonthKey(now);

    // Create a window starting from Jan 2026 til Dec 2026 (Full year 2026)
    const startYear = 2026;
    for (let month = 0; month < 12; month++) {
        const d = new Date(startYear, month, 1);
        const key = getMonthKey(d);
        const label = getMonthLabel(d);
        data.push({
            monthKey: key,
            label: label,
            paid: 0,
            upcoming: 0,
            total: 0,
            isCurrent: key === currentMonthKey,
        });
    }

    const cleanAmount = (val: any) => {
        if (typeof val === 'string') {
            return Number(val.replace(/,/g, '')) || 0;
        }
        return Number(val) || 0;
    };

    loans.forEach(loan => {
        // If loan is closed, we only care about past payments
        const isClosed = String(loan.status || "").toLowerCase() === "closed";

        if (loan.schedule && Array.isArray(loan.schedule)) {
            loan.schedule.forEach(entry => {
                if (!entry.date) return;
                
                // Ensure date format is consistent (YYYY-MM-DD)
                const entryDateMatch = entry.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (!entryDateMatch) return;
                
                const entryMonthKey = `${entryDateMatch[1]}-${entryDateMatch[2]}`;
                const dataPoint = data.find(d => d.monthKey === entryMonthKey);
                
                if (dataPoint) {
                    const isPaid = loan.payments && loan.payments[entry.date];
                    const amount = cleanAmount(entry.amount);
                    if (isPaid) {
                        dataPoint.paid += amount;
                    } else if (!isClosed) {
                        dataPoint.upcoming += amount;
                    }
                }
            });
        }
    });

    // Calculate totals for each data point
    data.forEach(d => {
        d.total = d.paid + d.upcoming;
    });

    return data;
  }, [loans]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.chartTooltip}>
          <p className={styles.tooltipLabel}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <p className={styles.tooltipTotal}>
            Total: {formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h4>Monthly EMI Forecast</h4>
        <p className={styles.chartSubtext}>Next 6 months based on active loan schedules</p>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            barGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e1dc" />
            <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#5f6368', fontSize: 12 }} 
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#5f6368', fontSize: 12 }}
                tickFormatter={(value) => value >= 100000 ? `${value / 100000}L` : value >= 1000 ? `${value / 1000}k` : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: 20 }}
            />
            <Bar 
                name="Paid" 
                dataKey="paid" 
                stackId="a" 
                fill="#81C784" 
                barSize={24}
                radius={[0, 0, 0, 0]} 
            />
            <Bar 
                name="Upcoming" 
                dataKey="upcoming" 
                stackId="a" 
                fill="#4DB6AC" 
                barSize={24}
                radius={[4, 4, 0, 0]} 
            >
                <LabelList 
                    dataKey="total" 
                    position="top" 
                    formatter={(value: any) => {
                        const num = Number(value);
                        if (isNaN(num) || num <= 0) return '';
                        return num >= 100000 ? `${(num / 100000).toFixed(1)}L` : num >= 1000 ? `${(num / 1000).toFixed(0)}k` : num;
                    }}
                    style={{ fill: '#5f6368', fontSize: 10, fontWeight: 500 }}
                    offset={10}
                />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
