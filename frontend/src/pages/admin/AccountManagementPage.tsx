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
  Diamond
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
      <div className="card shadow-premium" style={{ padding: 0, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
        <table className="data-table">
          <thead style={{ background: '#F8FAFC' }}>
            {activeTab === 'all' ? (
              <tr>
                <th style={{ padding: '16px 24px' }}>Thông tin cơ bản</th>
                <th>Phân quyền</th>
                <th>Trạng thái</th>
                <th>Ví Token</th>
                <th>Ngày gia nhập</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Quản trị</th>
              </tr>
            ) : (
              <tr>
                <th style={{ padding: '16px 24px' }}>Người dùng</th>
                <th>Gói dịch vụ</th>
                <th>Giá trị thanh toán</th>
                <th>Thời gian yêu cầu</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Thao tác</th>
              </tr>
            )}
          </thead>
          <tbody style={{ fontSize: 14 }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} style={{ padding: 20 }}><div className="skeleton" style={{ height: 48, width: '100%', borderRadius: 8 }} /></td>
                </tr>
              ))
            ) : activeTab === 'all' ? (
              filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover-row">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 12, 
                          background: user.role === 'admin' ? 'linear-gradient(135deg, #4361EE, #7C3AED)' : '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 800,
                          color: user.role === 'admin' ? '#FFFFFF' : '#64748B',
                          boxShadow: user.role === 'admin' ? '0 4px 6px -1px rgba(67, 97, 238, 0.2)' : 'none'
                        }}>
                          {(user.full_name || user.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1A1D2B' }}>{user.full_name || 'Chưa cập nhật'}</div>
                          <div style={{ fontSize: 12, color: '#94A3B8' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user.role === 'admin' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF2FF', color: '#4361EE', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                            <Shield size={12} /> Administrator
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', color: '#64748B', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                            Standard User
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {user.status === 'suspended' ? (
                          <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            ● Đã khóa
                          </span>
                        ) : (
                          <span style={{ background: '#F0FDF4', color: '#10B981', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            ● Hoạt động
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#0369A1' }}>
                        <Diamond size={14} fill="#0EA5E9" color="#0EA5E9" />
                        {user.token_balance?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <button 
                        className="btn-action" 
                        onClick={() => setSelectedUserId(user.id)}
                        style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, background: '#F1F5F9', color: '#1E293B', fontWeight: 600 }}
                      >
                        <Eye size={14} style={{ marginRight: 6 }} /> Chi tiết
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
                  <tr key={req.id} className="hover-row">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#1A1D2B' }}>{req.user_id}</div>
                      <div style={{ fontSize: 12, color: '#94A3B8' }}>Ref: {req.transfer_ref || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ background: '#4361EE', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {req.plan_code.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#10B981', fontSize: 15 }}>
                        {req.amount_vnd?.toLocaleString()}đ
                      </div>
                    </td>
                    <td style={{ color: '#64748B' }}>
                      {req.created_at ? new Date(req.created_at).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-action" 
                          style={{ background: '#10B981', color: 'white', padding: '8px 16px', borderRadius: 10 }}
                          onClick={() => handleApprove(req.id)}
                        >
                          <CheckCircle2 size={14} style={{ marginRight: 6 }} /> Duyệt
                        </button>
                        <button 
                          className="btn-action" 
                          style={{ background: '#FEE2E2', color: '#EF4444', padding: '8px 16px', borderRadius: 10 }}
                          onClick={() => handleReject(req.id)}
                        >
                          <XCircle size={14} style={{ marginRight: 6 }} /> Từ chối
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

      {/* ── Footer Info ── */}
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>
        Sử dụng tab "Chờ phê duyệt" để kiểm tra các giao dịch chuyển khoản thủ công từ người dùng.
      </div>

      {/* ── Detail Modal ── */}
      {selectedUserId && (
        <UserDetailModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
          onUpdate={fetchData}
        />
      )}
    </div>
  );
}
