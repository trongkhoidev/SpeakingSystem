import { useState, useEffect } from 'react';
import api from '../lib/api';
import { 
  Users, Activity, Star, Clock, HeartPulse,
  MessageSquare, LayoutGrid
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalPractices: number;
  totalTests: number;
  avgDurationPerAnswer: number;
  avgSatisfaction: number;
  activeUsers7d: number;
  retention7dPercent: number;
  satisfactionIndex: number;
  lowRatingCount: number;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface FeedbackItem {
  id: string;
  user_id?: string;
  rating: number;
  comment?: string;
  category?: string;
  created_at: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback'>('stats');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResp, usersResp, feedbackResp] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users'),
          api.get('/admin/feedback')
        ]);
        setStats(statsResp.data.stats);
        setUsers(usersResp.data);
        setFeedbacks(feedbackResp.data);
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
          Quản trị hệ thống
        </h1>
        <p style={{ color: '#6B7280', fontSize: '15px' }}>
          Tổng quan hoạt động người dùng và các chỉ số hài lòng.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        padding: '4px',
        background: '#F3F4F6',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { id: 'stats', label: 'Tổng quan', icon: LayoutGrid },
          { id: 'users', label: 'Người dùng', icon: Users },
          { id: 'feedback', label: 'Phản hồi', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? '#FFFFFF' : 'transparent',
              color: activeTab === tab.id ? '#4361EE' : '#6B7280',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <StatCard icon={Users} label="Tổng người dùng" value={stats?.totalUsers || 0} color="#4361EE" />
          <StatCard icon={Activity} label="Lượt luyện tập" value={stats?.totalPractices || 0} color="#10B981" />
          <StatCard icon={Star} label="Độ hài lòng" value={`${stats?.avgSatisfaction || 0}/5`} color="#F59E0B" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <StatCard icon={Clock} label="TG luyện tập trung bình" value={`${stats?.avgDurationPerAnswer || 0}s`} color="#8B5CF6" />
          <StatCard icon={Users} label="Active 7 ngày" value={stats?.activeUsers7d || 0} color="#0EA5E9" />
          <StatCard icon={Activity} label="Tỷ lệ giữ chân 7d" value={`${stats?.retention7dPercent || 0}%`} color="#14B8A6" />
          <StatCard icon={HeartPulse} label="Satisfaction Index" value={`${stats?.satisfactionIndex || 0}/100`} color="#EC4899" />
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th style={tableHeaderStyle}>Họ tên / Email</th>
                <th style={tableHeaderStyle}>Vai trò</th>
                <th style={tableHeaderStyle}>Ngày tham gia</th>
                <th style={tableHeaderStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{user.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{user.email}</div>
                  </td>
                  <td style={tableCellStyle}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '99px', 
                      fontSize: '11px', 
                      fontWeight: 700,
                      background: user.role === 'admin' ? '#EEF2FF' : '#F3F4F6',
                      color: user.role === 'admin' ? '#4361EE' : '#374151',
                      textTransform: 'uppercase'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={tableCellStyle}>{user.created_at?.split(' ')[0]}</td>
                  <td style={tableCellStyle}>
                    <button style={{ color: '#4361EE', fontWeight: 600, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                <th style={tableHeaderStyle}>Rating</th>
                <th style={tableHeaderStyle}>Category</th>
                <th style={tableHeaderStyle}>Comment</th>
                <th style={tableHeaderStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tableCellStyle}>{item.rating}/5</td>
                  <td style={tableCellStyle}>{item.category || 'General'}</td>
                  <td style={tableCellStyle}>{item.comment || '-'}</td>
                  <td style={tableCellStyle}>{item.created_at?.split(' ')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && (
            <div className="text-center py-12 text-gray-500">Chưa có dữ liệu phản hồi chi tiết.</div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <div style={{ 
      background: '#FFFFFF', 
      padding: '24px', 
      borderRadius: '20px', 
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '12px', 
        background: `${color}10`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '16px',
        color: color
      }}>
        <Icon size={20} />
      </div>
      <div style={{ fontSize: '14px', color: '#6B7280', fontWeight: 500, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: '#111827', fontFamily: 'Outfit, sans-serif' }}>{value}</div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '16px 24px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4B5563',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tableCellStyle: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: '14px',
  color: '#374151'
};
