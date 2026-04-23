import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Plan {
  code: string;
  name: string;
  monthly_tokens: number;
  practice_cost: number;
  test_start_cost: number;
  daily_trial_bonus: number;
  price_vnd: number;
}

export function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [plansResp, usageResp] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/usage'),
      ]);
      setPlans(plansResp.data.plans || []);
      setUsage(usageResp.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const subscribe = async (plan: Plan) => {
    const qrUrl = `https://img.vietqr.io/image/momo-0338831247-compact2.jpg?amount=${plan.price_vnd}&addInfo=LEXI ${plan.code} ${usage?.user_id || ''}`;
    
    const confirm = window.confirm(
      `THÔNG TIN THANH TOÁN:\n\n` +
      `- Gói: ${plan.name}\n` +
      `- Giá: ${plan.price_vnd.toLocaleString('vi-VN')} VND\n` +
      `- Ví MOMO: 0338831247 (NGUYEN TRONG KHOI)\n` +
      `- Nội dung: LEXI ${plan.code}\n\n` +
      `Bạn có muốn xem mã QR để thanh toán không?`
    );

    if (confirm) {
      window.open(qrUrl, '_blank');
      const transferRef = window.prompt('Sau khi chuyển khoản, vui lòng nhập mã giao dịch MOMO tại đây để admin duyệt:') || '';
      if (transferRef) {
        const res = await api.post(`/billing/subscribe/${plan.code}`, null, {
          params: { transfer_ref: transferRef, note: 'Momo Payment' },
        });
        window.alert(`Đã gửi yêu cầu. Mã request: ${res.data.request_id}. Vui lòng chờ admin xác nhận.`);
        await loadData();
      }
    }
  };

  const claimDaily = async () => {
    await api.post('/billing/claim-daily');
    await loadData();
  };

  const rewardFollow = async (platform: 'facebook' | 'x') => {
    await api.post(`/billing/reward-follow/${platform}`);
    await loadData();
  };

  if (loading) return <div style={{ padding: 24 }}>Đang tải gói dịch vụ...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Gói sử dụng & Token</h1>
      <p style={{ color: '#6B7280', marginBottom: 20 }}>
        Chi phí được thiết kế ở mức rẻ để thu hút user ban đầu, sau đó mở rộng theo nhu cầu sử dụng.
      </p>

      {usage && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div><b>Gói hiện tại:</b> {usage.plan_name}</div>
          <div><b>Token còn lại:</b> {usage.token_balance}</div>
          <div><b>Đã dùng tháng này:</b> {usage.monthly_token_used}/{usage.monthly_token_limit}</div>
          <div><b>Chi phí mỗi lần luyện:</b> {usage.costs.practice} token</div>
          <div><b>Chi phí mỗi lần bắt đầu test:</b> {usage.costs.test_start} token</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={claimDaily}>Nhận token dùng thử hằng ngày</button>
            <button className="btn btn-ghost" onClick={() => rewardFollow('facebook')}>Follow Facebook (+token)</button>
            <button className="btn btn-ghost" onClick={() => rewardFollow('x')}>Follow X (+token)</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {plans.map((plan) => (
          <div key={plan.code} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, background: '#fff' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{plan.name}</h3>
            <p style={{ color: '#6B7280', marginBottom: 12 }}>
              {plan.price_vnd === 0 ? 'Miễn phí' : `${plan.price_vnd.toLocaleString('vi-VN')} VND/tháng`}
            </p>
            <div>Token/tháng: <b>{plan.monthly_tokens}</b></div>
            <div>Practice: {plan.practice_cost} token</div>
            <div>Test start: {plan.test_start_cost} token</div>
            <div>Daily bonus: {plan.daily_trial_bonus} token</div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => subscribe(plan)}>
              Chọn gói
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

