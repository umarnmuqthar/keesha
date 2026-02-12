
'use client';

import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const COLORS = ['#FF5A5F', '#484848', '#767676', '#EB5542', '#FFB400'];

export default function DashboardCharts({ subSpend, loanSpend, categoryData }) {

    // Data for Pie Chart (Spend Distribution)
    const spendData = [
        { name: 'Subscriptions', value: subSpend },
        { name: 'Loan EMIs', value: loanSpend },
    ];

    // Filter out zero values to avoid ugly empty charts
    const activeSpendData = spendData.filter(d => d.value > 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
                    <p className="text-sm font-bold text-gray-900">{payload[0].name}</p>
                    <p className="text-sm text-red-600 font-semibold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Spend Distribution (Pie) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Spend Distribution</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {activeSpendData.length > 0 ? (
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={activeSpendData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {activeSpendData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>

            {/* Category Breakdown (Bar) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Cost by Category</h3>
                <div style={{ width: '100%', height: 300 }}>
                    {categoryData && categoryData.length > 0 ? (
                        <ResponsiveContainer>
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" fill="#FF5A5F" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">No category data</div>
                    )}
                </div>
            </div>
        </div>
    );
}
