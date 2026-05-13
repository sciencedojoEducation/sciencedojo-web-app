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
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function StudentProgressChart({ bookings }: StudentProgressChartProps) {
  const completedBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'completed');
  }, [bookings]);

  // Group by month
  const monthlyData = useMemo(() => {
    if (completedBookings.length === 0) return [];
    
    const counts: Record<string, number> = {};
    completedBookings.forEach(booking => {
      const date = new Date(booking.requested_date);
      // Format as "Jan 26"
      const monthYear = date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      counts[monthYear] = (counts[monthYear] || 0) + 1;
    });

    return Object.keys(counts).map(key => ({
      name: key,
      lessons: counts[key]
    })).sort((a, b) => {
      // Basic chronological sort (assuming recent data, could be improved for spanning many years)
      return new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime();
    });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-5 md:mt-8">
      {/* Monthly Progress Bar Chart */}
      <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-secondary/10 shadow-sm">
        <h3 className="text-secondary font-black text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-3">
          <div className="w-8 h-8 md:h-10 md:w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
             <svg className="w-4 h-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          </div>
          Lesson rhythm
        </h3>
        <div className="h-52 w-full md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ fontWeight: 900, color: '#1e293b' }}
              />
              <Bar dataKey="lessons" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subjects Pie Chart */}
      <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-secondary/10 shadow-sm flex flex-col">
        <h3 className="text-secondary font-black text-lg md:text-xl mb-4 md:mb-6 flex items-center gap-3">
          <div className="w-8 h-8 md:h-10 md:w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
             <svg className="w-4 h-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          Subject focus
        </h3>
        <div className="flex-1 min-h-[170px] md:min-h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={subjectData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: 700 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {subjectData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs font-bold text-secondary/70">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
