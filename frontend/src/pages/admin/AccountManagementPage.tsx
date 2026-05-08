import { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Ban,
  UserCheck,
  Diamond,
  BarChart3,
  History
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';
import { UserDetailModal } from '../../components/admin/UserDetailModal';

type TabType = 'all' | 'pending';

export function AccountManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedUserId(null);
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'all') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else {
        const res = await api.get('/admin/billing/pending');
        setPendingRequests(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/billing/requests/${id}/approve`);
      toast.success('Đã phê duyệt gói đăng ký');
      fetchData();
    } catch (err) {
      toast.error('Phê duyệt thất bại');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/admin/billing/requests/${id}/reject`);
      toast.success('Đã từ chối yêu cầu');
      fetchData();
    } catch (err) {
      toast.error('Từ chối thất bại');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            Quản lý tài khoản 👥
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Hệ thống phân quyền, kiểm soát trạng thái và phê duyệt giao dịch.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-badge" style={{ background: '#F0F9FF', color: '#0369A1', padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
            {users.length} Người dùng
          </div>
        </div>
      </div>

      {/* ── Action Bar ── */}
      <div className="card shadow-premium" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('all')}
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 10, padding: '10px 20px' }}
          >
            Danh sách người dùng
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 10, padding: '10px 20px', position: 'relative' }}
          >
            Yêu cầu chờ duyệt
            {pendingRequests.length > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', color: 'white', fontSize: 10, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'all' && (
          <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Tìm kiếm email hoặc tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 40, width: '100%', borderRadius: 12, background: '#F8FAFC' }}
              />
            </div>
            <select
              className="input"
              style={{ padding: '8px 16px', fontSize: 13, borderRadius: 12, background: '#F8FAFC', width: 160 }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div style={{
        display: 'flex',
        gap: 2,
        alignItems: 'start',
        width: '100%',
        background: '#F1F5F9',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ flex: 1, minWidth: 0, background: '#fff' }}>
          <div className="card shadow-premium" style={{ padding: 0, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
            <table className="data-table" style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#F8FAFC' }}>
                {activeTab === 'all' ? (
                  <tr>
                    <th style={{ padding: '16px 24px', textAlign: 'left', borderRight: '1px solid #F1F5F9', width: '30%' }}>Thông tin cơ bản</th>
                    <th style={{ width: '12%', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>Vai trò</th>
                    <th style={{ width: '12%', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '15%', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>Ví Token</th>
                    <th style={{ width: '15%', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>Gia nhập</th>
                    <th style={{ textAlign: 'center', paddingRight: 0, width: '16%' }}>Quản trị</th>
                  </tr>
                ) : (
                  <tr>
                    <th style={{ padding: '16px 24px', borderRight: '1px solid #F1F5F9', width: '30%', textAlign: 'left' }}>Người dùng</th>
                    <th style={{ borderRight: '1px solid #F1F5F9', width: '15%', textAlign: 'center' }}>Gói cước</th>
                    <th style={{ borderRight: '1px solid #F1F5F9', width: '15%', textAlign: 'center' }}>Số tiền</th>
                    <th style={{ borderRight: '1px solid #F1F5F9', width: '25%', textAlign: 'center' }}>Thời gian yêu cầu</th>
                    <th style={{ textAlign: 'center', width: '15%' }}>Thao tác</th>
                  </tr>
                )}
              </thead>
              <tbody style={{ fontSize: 14 }}>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={selectedUserId ? 3 : 6} style={{ padding: 20 }}><div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : activeTab === 'all' ? (
                  filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr
                        key={user.id}
                        className={`hover-row ${selectedUserId === user.id ? 'active-row' : ''}`}
                        style={{
                          background: selectedUserId === user.id ? '#F0F7FF' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedUserId(user.id)}
                      >
                        <td style={{ padding: '16px 24px', borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              background: user.role === 'admin' ? 'linear-gradient(135deg, #4361EE, #7C3AED)' : '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              color: user.role === 'admin' ? '#FFFFFF' : '#64748B'
                            }}>
                              {(user.full_name || user.email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1A1D2B', fontSize: 13 }}>{user.full_name || 'Chưa cập nhật'}</div>
                              <div style={{ fontSize: 11, color: '#94A3B8' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            {user.role === 'admin' ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF2FF', color: '#4361EE', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                                <Shield size={10} /> Admin
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', color: '#64748B', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
                                User
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            {user.status === 'suspended' ? (
                              <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                ● Khóa
                              </span>
                            ) : (
                              <span style={{ background: '#F0FDF4', color: '#10B981', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                ● Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#0369A1', justifyContent: 'center' }}>
                            <Diamond size={13} fill="#0EA5E9" color="#0EA5E9" />
                            {user.token_balance?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td style={{ color: '#64748B', fontSize: 12, borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(user.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 8,
                              fontSize: 12,
                              background: selectedUserId === user.id ? '#4361EE' : '#F1F5F9',
                              color: selectedUserId === user.id ? '#FFF' : '#1E293B',
                              fontWeight: 600,
                              margin: '0 auto'
                            }}
                          >
                            <Eye size={12} style={{ marginRight: 4 }} /> Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px 40px', color: '#94A3B8' }}>
                      <Users size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <div>Không tìm thấy tài khoản nào khớp với bộ lọc</div>
                    </td></tr>
                  )
                ) : (
                  pendingRequests.length > 0 ? (
                    pendingRequests.map(req => (
                      <tr 
                        key={req.id} 
                        className={`hover-row ${selectedUserId === req.user_id ? 'active-row' : ''}`}
                        onClick={() => setSelectedUserId(req.user_id)}
                        style={{ background: selectedUserId === req.user_id ? '#F0F7FF' : 'transparent', cursor: 'pointer' }}
                      >
                        <td style={{ padding: '16px 24px', borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E0E7FF', color: '#4361EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                              {(req.user_email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#1A1D2B', fontSize: 13 }}>{req.user_email}</div>
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Ref: {req.transfer_ref || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ borderRight: '1px solid #F1F5F9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                            <span style={{ background: '#EEF2FF', color: '#4361EE', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                              {req.plan_code}
                            </span>
                          </div>
                        </td>
                        <td style={{ borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>
                            {req.amount_vnd?.toLocaleString()}đ
                          </div>
                        </td>
                        <td style={{ color: '#64748B', borderRight: '1px solid #F1F5F9', fontSize: 12, textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                            <Clock size={12} />
                            {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            }) : 'N/A'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button 
                              className="btn-action" 
                              style={{ background: '#10B981', color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none' }}
                              onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                            >
                              Duyệt
                            </button>
                            <button 
                              className="btn-action" 
                              style={{ background: '#FEF2F2', color: '#EF4444', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: 'none' }}
                              onClick={(e) => { e.stopPropagation(); handleReject(req.id); }}
                            >
                              Từ chối
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 40px', color: '#94A3B8' }}>
                      <Clock size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                      <div>Hiện tại không có yêu cầu nâng cấp nào đang chờ</div>
                    </td></tr>
                  )
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* ── Detail Panel ── */}
        {selectedUserId && (
          <div style={{ width: 400, flexShrink: 0, borderLeft: '1px solid #E2E8F0', background: '#fff' }} className="animate-slide-left">
            <UserDetailPanel
              userId={selectedUserId}
              onClose={() => setSelectedUserId(null)}
              onUpdate={fetchData}
              activeTab={activeTab}
              pendingRequest={pendingRequests.find(r => r.user_id === selectedUserId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Internal component for Detail Panel to avoid modifying too many files
function UserDetailPanel({ userId, onClose, onUpdate, activeTab, pendingRequest }: {
  userId: string,
  onClose: () => void,
  onUpdate: () => void,
  activeTab?: string,
  pendingRequest?: any
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/users/${userId}/detail`);
      setData(res.data);
    } catch (err) {
      toast.error('Không thể tải chi tiết');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.post(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Đã mở khóa' : 'Đã khóa');
      fetchUserDetail();
      onUpdate();
    } catch (err) {
      toast.error('Thất bại');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="card shadow-premium" style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="skeleton" style={{ width: '80%', height: '80%' }} /></div>;

  const { user, wallet, stats, subscription_history } = data;

  return (
    <div className="card shadow-premium" style={{ padding: 24, background: '#FFF', position: 'sticky', top: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#4361EE', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {(user.full_name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A1D2B', margin: 0 }}>{user.full_name || 'User'}</h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{user.email}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
          <XCircle size={20} color="#94A3B8" />
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'pending' && pendingRequest && (
          <section className="animate-fade-in" style={{ background: '#FFF7ED', padding: 16, borderRadius: 12, border: '1px solid #FFEDD5', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#9A3412' }}>
              <Clock size={16} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>Yêu cầu nạp Token</span>
            </div>
            <div style={{ spaceY: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#9A3412' }}>Email người dùng:</span>
                <span style={{ fontWeight: 800, color: '#1A1D2B' }}>{pendingRequest.user_email || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#9A3412' }}>Mã tham chiếu:</span>
                <span style={{ fontWeight: 800, color: '#1A1D2B' }}>{pendingRequest.transfer_ref || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#9A3412' }}>Số tiền:</span>
                <span style={{ fontWeight: 800, color: '#10B981', fontSize: 14 }}>{pendingRequest.amount_vnd?.toLocaleString()}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                <span style={{ color: '#9A3412' }}>Thời gian yêu cầu:</span>
                <span style={{ fontWeight: 700, color: '#1A1D2B' }}>
                  {new Date(pendingRequest.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => {
                    api.post(`/admin/billing/requests/${pendingRequest.id}/approve`).then(() => { toast.success('Duyệt thành công'); onUpdate(); onClose(); });
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#10B981', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >Duyệt</button>
                <button
                  onClick={() => {
                    api.post(`/admin/billing/requests/${pendingRequest.id}/reject`).then(() => { toast.success('Đã từ chối'); onUpdate(); onClose(); });
                  }}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, background: '#fff', color: '#EF4444', border: '1px solid #FEE2E2', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >Từ chối</button>
              </div>
            </div>
          </section>
        )}

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Diamond size={14} color="#4361EE" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Ví & Gói cước</span>
          </div>
          <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 12, border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Gói hiện tại:</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#4361EE', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4 }}>{wallet.plan_code.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Số dư:</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1A1D2B' }}>{wallet.token_balance.toLocaleString()} 💎</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Đã dùng (tháng):</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{wallet.monthly_token_used} / {wallet.monthly_token_limit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Hết hạn:</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: wallet.expires_at ? '#DC2626' : '#64748B' }}>
                {wallet.expires_at ? new Date(wallet.expires_at).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
              </span>
            </div>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={14} color="#4361EE" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Thống kê học tập</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748B' }}>Luyện tập</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.total_practices}</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748B' }}>Thi thử</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.total_tests}</div>
            </div>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={14} color="#4361EE" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Thao tác quản trị</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={updating}
              onClick={() => handleUpdateStatus(user.status === 'active' ? 'suspended' : 'active')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                background: user.status === 'active' ? '#FEF2F2' : '#F0FDF4',
                color: user.status === 'active' ? '#EF4444' : '#10B981',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {user.status === 'active' ? <Ban size={12} style={{ marginRight: 4 }} /> : <UserCheck size={12} style={{ marginRight: 4 }} />}
              {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
            </button>
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                className="input"
                value={user.role}
                onChange={(e) => {
                  api.post(`/admin/users/${userId}/role`, { role: e.target.value })
                    .then(() => { toast.success('Đã đổi vai trò'); fetchUserDetail(); onUpdate(); });
                }}
                style={{ width: '100%', padding: '10px', fontSize: 12, borderRadius: 10 }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <History size={14} color="#4361EE" />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Lịch sử đăng ký</span>
          </div>
          <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #F1F5F9', borderRadius: 10 }}>
            {subscription_history.length > 0 ? (
              subscription_history.map((h: any) => (
                <div key={h.id} style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{h.plan_code.toUpperCase()}</div>
                    <div style={{ color: '#94A3B8' }}>{new Date(h.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#10B981' }}>{h.amount_vnd.toLocaleString()}đ</div>
                    <div style={{ fontSize: 9, color: '#94A3B8' }}>{h.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>Chưa có giao dịch</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
