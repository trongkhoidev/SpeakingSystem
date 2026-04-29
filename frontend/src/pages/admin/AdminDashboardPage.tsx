import { useEffect, useState } from 'react';
import { 
  Users, 
  Mic, 
  GraduationCap, 
  Activity, 
  Heart, 
  Clock, 
  AlertTriangle,
  Zap,
  MousePointerClick,
  TrendingUp
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import api from '../../lib/api';
import { StatCard } from '../../components/admin/StatCard';

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = data?.stats || {};
  const trends = data?.trends || { userGrowth: [], activity: [] };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Hệ thống Quản trị 🚀
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Theo dõi sức khỏe hệ thống và tương tác của người dùng.
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-secondary"
          style={{ fontSize: 13, padding: '8px 16px' }}
        >
          Làm mới dữ liệu
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 20 
      }}>
        <StatCard 
          title="Tổng người dùng" 
          value={stats.totalUsers || 0} 
          icon={Users} 
          color="#4361EE"
          loading={loading}
        />
        <StatCard 
          title="Lượt luyện tập" 
          value={stats.totalPractices || 0} 
          icon={Mic} 
          color="#10B981"
          loading={loading}
        />
        <StatCard 
          title="Lượt thi thử" 
          value={stats.totalTests || 0} 
          icon={GraduationCap} 
          color="#7C3AED"
          loading={loading}
        />
        <StatCard 
          title="Satisfaction Index" 
          value={`${stats.satisfactionIndex || 0}%`} 
          icon={Heart} 
          color="#F43F5E"
          loading={loading}
        />
        <StatCard 
          title="Tỷ lệ chuyển đổi" 
          value={`${stats.conversionRate || 0}%`} 
          icon={TrendingUp} 
          color="#8B5CF6"
          loading={loading}
          trend="up"
          trendValue="Guest → User"
        />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 20 
      }}>
        <StatCard 
          title="Active (7 ngày)" 
          value={stats.activeUsers7d || 0} 
          icon={Activity} 
          color="#0EA5E9"
          loading={loading}
          trend="up"
          trendValue={`${stats.retention7dPercent}%`}
        />
        <StatCard 
          title="Thời gian TB/Câu" 
          value={`${stats.avgDurationPerAnswer || 0}s`} 
          icon={Clock} 
          color="#F59E0B"
          loading={loading}
        />
        <StatCard 
          title="Đánh giá thấp" 
          value={stats.lowRatingCount || 0} 
          icon={AlertTriangle} 
          color="#EF4444"
          loading={loading}
        />
        <StatCard 
          title="Lượt dùng thử" 
          value={stats.totalTrials || 0} 
          icon={MousePointerClick} 
          color="#EC4899"
          loading={loading}
        />
        <StatCard 
          title="Tỷ lệ giữ chân" 
          value={`${stats.retention7dPercent || 0}%`} 
          icon={Zap} 
          color="#F59E0B"
          loading={loading}
        />
      </div>

      {/* ── Charts Section ── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
        gap: 24 
      }}>
        {/* User Growth Chart */}
        <div className="card shadow-premium" style={{ padding: 24, background: '#FFFFFF', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4361EE' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2B' }}>Tăng trưởng người dùng</h3>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={trends.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4361EE" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4361EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                  stroke="#94A3B8"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }}
                  cursor={{ stroke: '#4361EE', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="User mới" 
                  stroke="#4361EE" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Trend Chart */}
        <div className="card shadow-premium" style={{ padding: 24, background: '#FFFFFF', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#7C3AED' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2B' }}>Tương tác hệ thống</h3>
          </div>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={trends.activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPractices" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  fontSize={11} 
                  tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                  stroke="#94A3B8"
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: 12 }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12, paddingBottom: 20 }} />
                <Area 
                  stackId="1"
                  type="monotone" 
                  dataKey="practices" 
                  name="Luyện tập" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPractices)" 
                />
                <Area 
                  stackId="1"
                  type="monotone" 
                  dataKey="tests" 
                  name="Thi thử" 
                  stroke="#7C3AED" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTests)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, paddingBottom: 20 }}>
        © 2026 LexiLearn Admin Suite • Hệ thống đang hoạt động ổn định
      </div>
    </div>
  );
}
