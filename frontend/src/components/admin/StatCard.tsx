import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: string;
  loading?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendValue, color = '#4361EE', loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="card" style={{ padding: 20, minHeight: 120 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div className="skeleton" style={{ width: 60, height: 18, borderRadius: 4 }} />
        </div>
        <div className="skeleton" style={{ width: '80%', height: 32, marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div className="card hover-lift" style={{ 
      padding: 20, 
      borderLeft: `4px solid ${color}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Gradient */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        background: `${color}10`,
        borderRadius: '50%',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ 
            padding: 10, 
            borderRadius: 12, 
            background: `${color}15`, 
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} />
          </div>
          
          {trend && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 4, 
              fontSize: 12, 
              fontWeight: 700, 
              color: trend === 'up' ? '#10B981' : '#EF4444',
              background: trend === 'up' ? '#ECFDF5' : '#FEF2F2',
              padding: '4px 8px',
              borderRadius: 20
            }}>
              {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </div>
          )}
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2B', lineHeight: 1, marginBottom: 6 }}>
          {value}
        </div>
        
        <div style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>
          {title}
        </div>
      </div>
    </div>
  );
}
