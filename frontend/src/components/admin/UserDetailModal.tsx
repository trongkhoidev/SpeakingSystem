import { useEffect, useState } from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  Shield, 
  Wallet, 
  BarChart3, 
  History,
  Ban,
  UserCheck,
  UserPlus
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserDetailModal({ userId, onClose, onUpdate }: UserDetailModalProps) {
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
      toast.error('Không thể tải chi tiết người dùng');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.post(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(newStatus === 'active' ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản');
      fetchUserDetail();
      onUpdate();
    } catch (err) {
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    try {
      setUpdating(true);
      await api.post(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Đã thay đổi vai trò thành ${newRole}`);
      fetchUserDetail();
      onUpdate();
    } catch (err) {
      toast.error('Cập nhật vai trò thất bại');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return null;

  const { user, wallet, stats, subscription_history } = data;

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: 800, width: '95%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#4361EE', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1D2B' }}>{user.full_name || 'N/A'}</h2>
              <div style={{ fontSize: 13, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={12} /> {user.email}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, spaceY: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* Left Column: Stats & Plan */}
            <div className="space-y-6">
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wallet size={16} color="#4361EE" /> Thông tin ví & Gói cước
                </h3>
                <div className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Gói hiện tại:</span>
                    <span className="badge badge--primary" style={{ textTransform: 'uppercase' }}>{wallet.plan_code}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Số dư Token:</span>
                    <span style={{ fontWeight: 800, color: '#0369A1' }}>{wallet.token_balance} 💎</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#64748B' }}>Đã dùng (tháng):</span>
                    <span style={{ fontWeight: 600 }}>{wallet.monthly_token_used} / {wallet.monthly_token_limit}</span>
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BarChart3 size={16} color="#4361EE" /> Thống kê học tập
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Luyện tập</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.total_practices}</div>
                  </div>
                  <div className="card" style={{ padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Thi thử</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{stats.total_tests}</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Actions & Log */}
            <div className="space-y-6">
              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={16} color="#4361EE" /> Thao tác quản trị
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {user.status === 'suspended' ? (
                    <button 
                      disabled={updating}
                      onClick={() => handleUpdateStatus('active')}
                      className="btn" 
                      style={{ background: '#ECFDF5', color: '#059669', flex: 1, fontSize: 13 }}
                    >
                      <UserCheck size={14} style={{ marginRight: 6 }} /> Mở khóa
                    </button>
                  ) : (
                    <button 
                      disabled={updating}
                      onClick={() => handleUpdateStatus('suspended')}
                      className="btn" 
                      style={{ background: '#FEF2F2', color: '#DC2626', flex: 1, fontSize: 13 }}
                    >
                      <Ban size={14} style={{ marginRight: 6 }} /> Khóa tài khoản
                    </button>
                  )}

                  <select 
                    disabled={updating}
                    value={user.role}
                    onChange={(e) => handleUpdateRole(e.target.value)}
                    className="input"
                    style={{ flex: 1, fontSize: 13, minWidth: 140 }}
                  >
                    <option value="user">Vai trò: User</option>
                    <option value="admin">Vai trò: Admin</option>
                  </select>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History size={16} color="#4361EE" /> Lịch sử đăng ký
                </h3>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {subscription_history.length > 0 ? (
                    subscription_history.map((req: any) => (
                      <div key={req.id} style={{ padding: '8px 12px', borderBottom: '1px solid #F1F5F9', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{req.plan_code.toUpperCase()}</div>
                          <div style={{ color: '#94A3B8' }}>{req.created_at.split('T')[0]}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700 }}>{req.amount_vnd.toLocaleString()}đ</div>
                          <div style={{ fontSize: 10, color: req.status === 'approved' ? '#10B981' : req.status === 'pending' ? '#F59E0B' : '#EF4444' }}>
                            {req.status}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: 20 }}>Chưa có lịch sử giao dịch</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
