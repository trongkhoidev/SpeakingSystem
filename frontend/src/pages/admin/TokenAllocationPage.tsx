import { useEffect, useState } from 'react';
import { 
  Diamond, 
  Send, 
  History, 
  User, 
  Hash, 
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export function TokenAllocationPage() {
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get('/admin/tokens/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch token history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || amount <= 0) {
      toast.error('Vui lòng nhập đầy đủ email và số lượng token hợp lệ');
      return;
    }

    try {
      setLoading(true);
      await api.post('/admin/tokens/allocate', { email, amount, reason });
      toast.success(`Đã cấp phát ${amount} token cho ${email}`);
      setEmail('');
      setAmount(0);
      setReason('');
      fetchHistory();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Cấp phát thất bại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
          Cấp phát Token 💎
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
          Hệ thống thưởng token, điều chỉnh số dư và quản trị tài chính người dùng.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32, alignItems: 'start' }}>
        
        {/* ── Allocation Form ── */}
        <div className="card shadow-premium" style={{ padding: 32, background: '#FFFFFF', border: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0F4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Send size={18} color="#4361EE" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1D2B' }}>Lệnh cấp phát</h3>
          </div>

          <form onSubmit={handleAllocate} className="space-y-6">
            <div className="form-group">
              <label className="label" style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 13 }}>Email người nhận</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  className="input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: 44, width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', height: 48 }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 13 }}>Số lượng Token</label>
              <div style={{ position: 'relative' }}>
                <Hash size={16} color="#94A3B8" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="number" 
                  className="input" 
                  placeholder="Nhập số token..."
                  value={amount || ''}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  style={{ paddingLeft: 44, width: '100%', borderRadius: 12, border: '1px solid #E2E8F0', height: 48, fontWeight: 800, color: '#0369A1' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" style={{ fontWeight: 700, marginBottom: 8, display: 'block', fontSize: 13 }}>Lý do & Ghi chú</label>
              <div style={{ position: 'relative' }}>
                <MessageSquare size={16} color="#94A3B8" style={{ position: 'absolute', left: 16, top: 16 }} />
                <textarea 
                  className="input" 
                  placeholder="Tại sao bạn cấp phát số token này?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ paddingLeft: 44, width: '100%', minHeight: 100, paddingTop: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, boxShadow: '0 10px 15px -3px rgba(67, 97, 238, 0.3)' }}
              disabled={loading}
            >
              {loading ? 'Đang xử lý giao dịch...' : 'Xác nhận cấp phát ngay'}
            </button>
          </form>
        </div>

        {/* ── Info & Analytics ── */}
        <div className="space-y-6">
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, #4361EE, #7C3AED)', border: 'none', color: 'white' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <ShieldCheck size={20} /> Quy tắc an toàn
            </h3>
            <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6 }}>
              Mọi hành động cấp phát token đều được ghi lại trong nhật ký hệ thống. Admin chịu trách nhiệm hoàn toàn cho các giao dịch này.
            </p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Trạng thái</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>🔐 Mã hóa 256-bit</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Xác thực</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>✅ Admin Verified</div>
              </div>
            </div>
          </div>

          <div className="card shadow-premium" style={{ padding: 24, background: '#FFFFFF', border: '1px solid #F1F5F9' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1A1D2B', marginBottom: 16 }}>Thống kê nhanh</h3>
            <div className="space-y-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>Tổng cấp phát tháng này</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2B' }}>-- 💎</span>
              </div>
              <div style={{ height: 1, background: '#F1F5F9' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748B' }}>Giao dịch gần nhất</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4361EE' }}>{history[0]?.created_at ? 'Hôm nay' : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── History Table ── */}
      <div className="card shadow-premium" style={{ padding: 0, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={18} color="#64748B" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1D2B' }}>Lịch sử cấp phát token</h3>
          </div>
          <button 
            onClick={fetchHistory}
            className="btn btn-secondary" 
            style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10 }}
          >
            Làm mới nhật ký
          </button>
        </div>
        <table className="data-table">
          <thead style={{ background: '#F8FAFC' }}>
            <tr>
              <th style={{ padding: '16px 24px' }}>Admin thực hiện</th>
              <th>Người nhận</th>
              <th>Số lượng</th>
              <th>Lý do & Nội dung</th>
              <th style={{ textAlign: 'right', paddingRight: 24 }}>Thời gian</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: 14 }}>
            {fetchingHistory ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={5} style={{ padding: 20 }}><div className="skeleton" style={{ height: 44, width: '100%', borderRadius: 8 }} /></td></tr>
              ))
            ) : history.length > 0 ? (
              history.map((row) => (
                <tr key={row.id} className="hover-row">
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>{row.admin_email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#4361EE' }}>{row.recipient_email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#10B981', fontSize: 15 }}>
                      <Diamond size={14} fill="#10B981" />
                      +{row.amount.toLocaleString()}
                    </div>
                  </td>
                  <td style={{ color: '#64748B', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.reason}
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: 24, color: '#94A3B8', fontSize: 12 }}>
                    {new Date(row.created_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '60px 40px', color: '#94A3B8' }}>
                  <History size={40} style={{ opacity: 0.1, marginBottom: 12 }} />
                  <div>Chưa có nhật ký giao dịch nào được ghi lại.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
