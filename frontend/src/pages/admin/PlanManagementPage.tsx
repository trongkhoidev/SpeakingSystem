import { useEffect, useState } from 'react';
import { 
  Settings, 
  Save, 
  Diamond, 
  Mic, 
  GraduationCap, 
  Gift, 
  Coins,
  AlertCircle,
  RefreshCcw
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export function PlanManagementPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/billing/plans');
      setPlans(res.data.plans || []);
    } catch (err) {
      toast.error('Không thể tải danh sách gói');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: any) => {
    setEditingPlan(plan.code);
    setEditValues({ ...plan });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    try {
      setLoading(true);
      await api.put(`/admin/billing/plans/${editingPlan}`, editValues);
      toast.success(`Đã cập nhật gói ${editingPlan.toUpperCase()}`);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      toast.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Quản lý Gói & Token ⚙️
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Cấu hình định mức token, chi phí và giá bán cho từng phân khúc người dùng.
          </p>
        </div>
        <button 
          onClick={fetchPlans}
          className="btn btn-secondary"
          style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RefreshCcw size={14} /> Làm mới
        </button>
      </div>

      {/* ── Alert Info ── */}
      <div style={{ 
        padding: '16px 20px', 
        borderRadius: 12, 
        background: '#FFF7ED', 
        border: '1px solid #FFEDD5',
        display: 'flex',
        gap: 16,
        alignItems: 'center'
      }}>
        <div style={{ padding: 10, borderRadius: '50%', background: '#FFEDD5', color: '#C2410C' }}>
          <AlertCircle size={24} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#9A3412' }}>Lưu ý về Billing Cycle</div>
          <p style={{ fontSize: 13, color: '#C2410C', marginTop: 2 }}>
            Mọi thay đổi về <strong>Định mức Token hàng tháng</strong> sẽ chỉ có hiệu lực với người dùng vào đầu chu kỳ thanh toán tiếp theo. 
            Giá tiền VND và Chi phí Token (Practice/Test) sẽ có hiệu lực ngay lập tức.
          </p>
        </div>
      </div>

      {/* ── Plans Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {loading && plans.length === 0 ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 400, borderRadius: 16 }} />
          ))
        ) : (
          plans.map(plan => {
            const isEditing = editingPlan === plan.code;
            return (
              <div 
                key={plan.code} 
                className="card" 
                style={{ 
                  padding: 24, 
                  border: isEditing ? '2px solid #4361EE' : '1px solid #E2E8F0',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <div style={{ 
                    padding: '6px 12px', 
                    borderRadius: 20, 
                    background: plan.code === 'plus' ? '#FEE2E2' : plan.code === 'starter' ? '#E0F2FE' : '#F1F5F9',
                    color: plan.code === 'plus' ? '#DC2626' : plan.code === 'starter' ? '#0284C7' : '#64748B',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {plan.code}
                  </div>
                  {!isEditing ? (
                    <button 
                      onClick={() => startEdit(plan)}
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: 12 }}
                    >
                      Chỉnh sửa
                    </button>
                  ) : (
                    <button 
                      onClick={handleSave}
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Save size={14} /> Lưu
                    </button>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 14, color: '#64748B' }}>Tên hiển thị</div>
                  {isEditing ? (
                    <input 
                      className="input" 
                      style={{ width: '100%', fontSize: 20, fontWeight: 800, marginTop: 4 }}
                      value={editValues.name}
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    />
                  ) : (
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1D2B' }}>{plan.name}</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                      <Diamond size={14} color="#4361EE" /> Token mỗi tháng
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}
                        value={editValues.monthly_tokens}
                        onChange={(e) => setEditValues({ ...editValues, monthly_tokens: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <div style={{ fontWeight: 700 }}>{plan.monthly_tokens}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                      <Mic size={14} color="#10B981" /> Phí luyện tập
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}
                        value={editValues.practice_cost}
                        onChange={(e) => setEditValues({ ...editValues, practice_cost: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <div style={{ fontWeight: 700 }}>{plan.practice_cost}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                      <GraduationCap size={14} color="#7C3AED" /> Phí thi thử
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}
                        value={editValues.test_start_cost}
                        onChange={(e) => setEditValues({ ...editValues, test_start_cost: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <div style={{ fontWeight: 700 }}>{plan.test_start_cost}</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
                      <Gift size={14} color="#F59E0B" /> Thưởng ngày
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: 80, textAlign: 'right', padding: '4px 8px' }}
                        value={editValues.daily_trial_bonus}
                        onChange={(e) => setEditValues({ ...editValues, daily_trial_bonus: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <div style={{ fontWeight: 700 }}>{plan.daily_trial_bonus}</div>
                    )}
                  </div>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#1A1D2B', marginBottom: 4 }}>
                      <Settings size={14} color="#64748B" /> Thông tin thanh toán
                    </div>
                    {isEditing ? (
                      <textarea 
                        className="input" 
                        placeholder="Vietcombank - 123456789 - NGUYEN VAN A"
                        style={{ width: '100%', fontSize: 12, minHeight: 60 }}
                        value={editValues.bank_account_info || ''}
                        onChange={(e) => setEditValues({ ...editValues, bank_account_info: e.target.value })}
                      />
                    ) : (
                      <div style={{ fontSize: 12, color: '#64748B', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8 }}>
                        {plan.bank_account_info || 'Chưa thiết lập'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#1A1D2B' }}>
                      <Coins size={14} color="#B45309" /> Giá tiền (VND)
                    </div>
                    {isEditing ? (
                      <input 
                        type="number" 
                        className="input" 
                        style={{ width: 120, textAlign: 'right', padding: '4px 8px', fontWeight: 800 }}
                        value={editValues.price_vnd}
                        onChange={(e) => setEditValues({ ...editValues, price_vnd: parseInt(e.target.value) || 0 })}
                      />
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#B45309' }}>
                        {plan.price_vnd?.toLocaleString()}đ
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <button 
                    onClick={() => setEditingPlan(null)}
                    style={{ 
                      width: '100%', 
                      marginTop: 20, 
                      fontSize: 12, 
                      color: '#64748B', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
