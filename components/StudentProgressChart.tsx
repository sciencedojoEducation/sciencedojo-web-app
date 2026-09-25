"use client";

import React, { useMemo } from 'react';
import { Booking } from '@/lib/supabase-queries';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface StudentProgressChartProps {
  bookings: Booking[];
  appearance?: 'default' | 'student';
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const STUDENT_COLORS = ['var(--student-accent)', 'var(--student-chart-secondary)', 'var(--student-chart-tertiary)', '#9a88aa', '#c58d83', '#8a9eb5'];
const monthFormatter = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export default function StudentProgressChart({ bookings, appearance = 'default' }: StudentProgressChartProps) {
  const isStudent = appearance === 'student';
  const chartColors = isStudent ? STUDENT_COLORS : COLORS;
  const completedBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'completed');
  }, [bookings]);

  // Group by month
  const monthlyData = useMemo(() => {
    if (completedBookings.length === 0) return [];
    
    const counts: Record<string, number> = {};
    completedBookings.forEach(booking => {
      const date = new Date(booking.requested_date);
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    });

    return Object.keys(counts).sort().map(key => ({
      name: monthFormatter.format(new Date(`${key}-01T00:00:00Z`)),
      lessons: counts[key]
    }));
  }, [completedBookings]);

  // Group by subject
  const subjectData = useMemo(() => {
    if (completedBookings.length === 0) return [];

    const counts: Record<string, number> = {};
    completedBookings.forEach(booking => {
      const subject = booking.subject || 'General';
      counts[subject] = (counts[subject] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value); // Sort by highest
  }, [completedBookings]);

  if (completedBookings.length === 0) {
    return null; // Don't show charts if no completed history
  }

  return (
    <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${isStudent ? 'mt-4' : 'mt-5 md:mt-8 md:gap-6'}`}>
      {/* Monthly Progress Bar Chart */}
      <div className={`lg:col-span-2 border ${isStudent ? 'rounded-[1.4rem] border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-6' : 'rounded-[1.5rem] border-secondary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-8'}`}>
        <h3 className={`mb-4 flex items-center gap-3 ${isStudent ? 'text-base font-semibold tracking-tight text-[var(--student-ink)]' : 'text-lg font-black text-secondary md:mb-6 md:text-xl'}`}>
          <div className={`flex items-center justify-center rounded-xl ${isStudent ? 'h-9 w-9 bg-[var(--student-accent-soft)] text-[var(--student-accent)]' : 'h-8 w-8 bg-blue-50 text-blue-600 md:h-10 md:w-10'}`}>
             <svg className="w-4 h-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          </div>
          Lesson rhythm
        </h3>
        <div className={isStudent ? 'h-48 w-full sm:h-52' : 'h-52 w-full md:h-64'}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isStudent ? 'var(--student-chart-grid)' : '#e2e8f0'} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isStudent ? 'var(--student-chart-axis)' : '#64748b', fontSize: 12, fontWeight: isStudent ? 500 : 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isStudent ? 'var(--student-chart-axis)' : '#94a3b8', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: isStudent ? 'var(--student-accent-soft)' : '#f8fafc' }}
                contentStyle={{ borderRadius: isStudent ? '12px' : '16px', border: isStudent ? '1px solid var(--student-line)' : 'none', background: isStudent ? 'var(--student-surface)' : '#fff', color: isStudent ? 'var(--student-ink)' : '#1e293b', boxShadow: isStudent ? '0 6px 20px rgba(24, 34, 49, 0.06)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ fontWeight: isStudent ? 600 : 900, color: isStudent ? 'var(--student-ink)' : '#1e293b' }}
              />
              <Bar dataKey="lessons" fill={isStudent ? 'var(--student-accent)' : '#3b82f6'} radius={[6, 6, 6, 6]} barSize={isStudent ? 28 : 40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject focus pie chart */}
      <div className={`flex flex-col border ${isStudent ? 'rounded-[1.4rem] border-[var(--student-line)] bg-[var(--student-surface)] p-5 sm:p-6' : 'rounded-[1.5rem] border-secondary/10 bg-white p-4 shadow-sm md:rounded-[2rem] md:p-8'}`}>
        <h3 className={`mb-4 flex items-center gap-3 ${isStudent ? 'text-base font-semibold tracking-tight text-[var(--student-ink)]' : 'text-lg font-black text-secondary md:mb-6 md:text-xl'}`}>
          <div className={`flex items-center justify-center rounded-xl ${isStudent ? 'h-9 w-9 bg-[var(--student-accent-soft)] text-[var(--student-accent)]' : 'h-8 w-8 bg-purple-50 text-purple-600 md:h-10 md:w-10'}`}>
             <svg className="w-4 h-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          Subject focus
        </h3>
        <div className="flex w-full flex-1 flex-col items-center justify-center">
          <div className={isStudent ? 'h-40 w-full' : 'h-52 w-full'}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isStudent ? 48 : 60}
                  outerRadius={isStudent ? 68 : 80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: isStudent ? '1px solid var(--student-line)' : 'none', background: isStudent ? 'var(--student-surface)' : '#fff', color: isStudent ? 'var(--student-ink)' : '#1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={`flex max-w-full flex-wrap justify-center gap-x-4 gap-y-2 ${isStudent ? 'mt-3 px-2 text-xs font-medium text-[var(--student-muted)]' : 'mt-4 text-xs font-bold text-secondary/70'}`}>
            {subjectData.map((entry, index) => (
              <div key={entry.name} className="flex max-w-full items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
