import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Check, Zap, Star, ShieldCheck, CreditCard, 
  ArrowRight, Info, Gift, Facebook, Twitter, 
  QrCode, Copy, CheckCircle2, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [transferRef, setTransferRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DURATIONS = {
    monthly: { months: 1, discount: 0, label: 'Tháng' },
    quarterly: { months: 3, discount: 0.15, label: '3 Tháng' },
    yearly: { months: 12, discount: 0.35, label: '1 Năm' }
  };

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

  const calculatePrice = (basePrice: number) => {
    const { months, discount } = DURATIONS[billingCycle];
    return Math.round((basePrice * months * (1 - discount)) / 1000) * 1000;
  };

  const handleSubscribe = async () => {
    if (!selectedPlan || !transferRef) return;
    setIsSubmitting(true);
    try {
      const totalPrice = calculatePrice(selectedPlan.price_vnd);
      const res = await api.post(`/billing/subscribe/${selectedPlan.code}`, null, {
        params: { 
          transfer_ref: transferRef, 
          note: `${DURATIONS[billingCycle].label} Plan - QR Payment`,
          amount_override: totalPrice // Backend should handle this if possible
        },
      });
      toast.success('Đã gửi yêu cầu nâng cấp! Vui lòng chờ admin xác nhận.');
      setCheckoutStep(3);
      await loadData();
    } catch (e) {
      toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimDaily = async () => {
    try {
      await api.post('/billing/claim-daily');
      toast.success('Đã nhận token dùng thử hằng ngày!');
      await loadData();
    } catch (e) {
      toast.error('Hôm nay bạn đã nhận rồi!');
    }
  };

  const rewardFollow = async (platform: 'facebook' | 'x') => {
    const links = {
      facebook: 'https://www.facebook.com/trg.kh.05',
      x: 'https://x.com/trongkhoidev'
    };
    
    window.open(links[platform], '_blank');
    
    try {
      await api.post(`/billing/reward-follow/${platform}`);
      toast.success(`Đang mở ${platform}... Token sẽ được cộng sau khi bạn fl!`);
      await loadData();
    } catch (e) {
      toast.error('Yêu cầu không hợp lệ hoặc đã được nhận.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.info('Đã sao chép nội dung chuyển khoản!');
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ── Header ── */}
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            Nâng cấp tài khoản & Token
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 max-w-2xl mx-auto text-lg"
          >
            Tiết kiệm hơn với các gói dài hạn. Nâng band IELTS thần tốc cùng Lexi AI.
          </motion.p>
        </div>

        {/* ── Billing Toggle ── */}
        <div className="flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
            {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  billingCycle === cycle 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {DURATIONS[cycle].label}
                {DURATIONS[cycle].discount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-md">
                    -{DURATIONS[cycle].discount * 100}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Current Usage Dashboard ── */}
      {usage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 text-white p-2 rounded-xl">
                  <Zap size={20} fill="currentColor" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Tình trạng tài khoản</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <UsageStat label="Gói hiện tại" value={usage.plan_name} sub="Hạn mức tháng" />
                <UsageStat label="Token còn lại" value={usage.token_balance} sub="Khả dụng ngay" />
                <UsageStat label="Đã dùng" value={`${usage.monthly_token_used}/${usage.monthly_token_limit}`} sub="Tháng này" />
                <UsageStat label="Cấp độ" value="Standard" sub="AI Examiner" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button 
                onClick={claimDaily}
                className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <Gift size={18} />
                Nhận token hằng ngày
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => rewardFollow('facebook')} 
                  title="Follow Facebook"
                  className={`p-3.5 rounded-2xl transition-all border ${
                    usage.facebook_rewarded 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Facebook size={20} fill={usage.facebook_rewarded ? 'currentColor' : 'none'} />
                </button>
                <button 
                  onClick={() => rewardFollow('x')} 
                  title="Follow X"
                  className={`p-3.5 rounded-2xl transition-all border ${
                    usage.x_rewarded 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Twitter size={20} fill={usage.x_rewarded ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Pricing Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, i) => {
          const currentPrice = calculatePrice(plan.price_vnd);
          return (
            <PricingCard 
              key={plan.code} 
              plan={plan} 
              displayPrice={currentPrice}
              cycleLabel={DURATIONS[billingCycle].label}
              delay={i * 0.1} 
              isCurrent={usage?.plan_name?.toLowerCase().includes(plan.name.toLowerCase())}
              onSelect={() => {
                setSelectedPlan(plan);
                setCheckoutStep(1);
              }} 
            />
          );
        })}
      </div>

      {/* ── Policies & Trust ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-10 border-t border-slate-100">
        <TrustInfo icon={ShieldCheck} title="Bảo mật thanh toán" desc="Giao dịch trực tiếp qua ngân hàng nội địa/MOMO cực kỳ an toàn." />
        <TrustInfo icon={Info} title="Chính sách Token" desc="Token được cộng ngay sau khi admin duyệt. Không giới hạn thời gian sử dụng." />
        <TrustInfo icon={CheckCircle2} title="Hỗ trợ 24/7" desc="Gặp vấn đề khi nạp? Liên hệ ngay Fanpage để được hỗ trợ tức thì." />
      </div>

      {/* ── Checkout Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedPlan(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors z-20"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row h-full">
                {/* Left side: Plan Info */}
                <div className="w-full md:w-5/12 bg-slate-50 p-10 space-y-8 border-r border-slate-100">
                  <div className="space-y-4">
                    <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bạn đã chọn</p>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedPlan.name}</h3>
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Gói {DURATIONS[billingCycle].label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200">
                    <FeatureItem label={`${selectedPlan.monthly_tokens} Token mỗi tháng`} />
                    <FeatureItem label={`${selectedPlan.practice_cost} token / lần luyện`} />
                    <FeatureItem label={`${selectedPlan.test_start_cost} token / bài test`} />
                    <FeatureItem label="Hỗ trợ phân tích chuyên sâu" />
                  </div>

                  <div className="pt-6">
                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                      * Bằng việc nhấn tiếp tục, bạn đồng ý với chính sách sử dụng token của LexiLearn.
                    </p>
                  </div>
                </div>

                {/* Right side: Steps */}
                <div className="w-full md:w-7/12 p-10">
                  {checkoutStep === 1 && (
                    <div className="h-full flex flex-col justify-between space-y-8">
                      <div className="space-y-6">
                        <h4 className="text-xl font-black text-slate-900">Xác nhận thanh toán</h4>
                        <div className="bg-indigo-50 p-6 rounded-3xl space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Tạm tính ({DURATIONS[billingCycle].label})</span>
                            <span className="font-bold text-slate-900">
                              {(selectedPlan.price_vnd * DURATIONS[billingCycle].months).toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Ưu đãi {DURATIONS[billingCycle].label}</span>
                            <span className="text-emerald-600 font-bold">
                              -{((selectedPlan.price_vnd * DURATIONS[billingCycle].months) - calculatePrice(selectedPlan.price_vnd)).toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                          <div className="pt-3 border-t border-indigo-100 flex justify-between items-center">
                            <span className="font-black text-slate-900">Tổng cộng</span>
                            <span className="text-2xl font-black text-indigo-600">
                              {calculatePrice(selectedPlan.price_vnd).toLocaleString('vi-VN')} VND
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-indigo-600" /> 
                            Lưu ý quan trọng:
                          </p>
                          <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                            <li>Vui lòng chuyển khoản đúng số tiền và nội dung.</li>
                            <li>Token sẽ được nạp trong vòng 5-30 phút sau khi thanh toán.</li>
                            <li>Nếu sau 1 giờ chưa nhận được, vui lòng liên hệ hỗ trợ.</li>
                          </ul>
                        </div>
                      </div>

                      <button 
                        onClick={() => setCheckoutStep(2)}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[15px] hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                      >
                        Tiến hành thanh toán
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  )}

                  {checkoutStep === 2 && (
                    <div className="h-full flex flex-col space-y-6">
                      <h4 className="text-xl font-black text-slate-900 text-center">Quét mã chuyển khoản</h4>
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-3 border-4 border-slate-50 rounded-3xl shadow-lg relative group">
                          <img 
                            src={`https://img.vietqr.io/image/momo-0338831247-compact2.jpg?amount=${calculatePrice(selectedPlan.price_vnd)}&addInfo=LEXI ${selectedPlan.code} ${DURATIONS[billingCycle].months}T ${usage?.user_id?.slice(-4) || ''}`}
                            alt="Payment QR"
                            className="w-48 h-48 rounded-xl"
                          />
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                             <QrCode className="text-indigo-600" size={32} />
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Sử dụng MOMO hoặc app ngân hàng để quét</p>
                      </div>

                      <div className="space-y-4">
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nội dung chuyển khoản</p>
                               <p className="text-sm font-black text-indigo-600 tracking-wider text-wrap">
                                 LEXI {selectedPlan.code} {DURATIONS[billingCycle].months}T {usage?.user_id?.slice(-4) || ''}
                               </p>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(`LEXI ${selectedPlan.code} ${DURATIONS[billingCycle].months}T ${usage?.user_id?.slice(-4) || ''}`)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                               <Copy size={18} />
                            </button>
                         </div>

                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900">Mã giao dịch / Mã tham chiếu</label>
                            <input 
                              type="text" 
                              value={transferRef}
                              onChange={(e) => setTransferRef(e.target.value)}
                              placeholder="Nhập mã sau khi đã chuyển khoản"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                            />
                         </div>
                      </div>

                      <button 
                        onClick={handleSubscribe}
                        disabled={!transferRef || isSubmitting}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[15px] hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-200 mt-auto"
                      >
                        {isSubmitting ? 'Đang gửi...' : 'Tôi đã chuyển khoản xong'}
                      </button>
                    </div>
                  )}

                  {checkoutStep === 3 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-scale-in">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-50">
                        <CheckCircle2 size={40} />
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-2xl font-black text-slate-900">Yêu cầu đã được gửi!</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                          Cảm ơn bạn đã tin tưởng LexiLearn. Admin sẽ duyệt yêu cầu của bạn trong thời gian sớm nhất (thường là 15 phút).
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedPlan(null)}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
                      >
                        Về trang cá nhân
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsageStat({ label, value, sub }: { label: string, value: string | number, sub: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
    </div>
  );
}

function PricingCard({ plan, displayPrice, cycleLabel, delay, onSelect, isCurrent }: { plan: Plan, displayPrice: number, cycleLabel: string, delay: number, onSelect: () => void, isCurrent: boolean }) {
  const isFree = plan.price_vnd === 0;
  const isPlus = plan.code === 'plus';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative p-8 bg-white border-2 rounded-[2.5rem] flex flex-col h-full transition-all hover:translate-y-[-4px] ${
        isPlus ? 'border-indigo-600 shadow-xl shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 shadow-sm'
      }`}
    >
      {isPlus && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
          Khuyên dùng
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-black text-slate-900 mb-1">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900">
            {isFree ? 'Miễn phí' : `${(displayPrice / 1000).toLocaleString('vi-VN')}k`}
          </span>
          {!isFree && <span className="text-sm font-bold text-slate-400">/ {cycleLabel}</span>}
        </div>
      </div>

      <div className="space-y-4 mb-10 flex-grow">
        <Benefit icon={Zap} label={`${plan.monthly_tokens} Token mỗi tháng`} />
        <Benefit icon={Check} label={`Luyện tập: ${plan.practice_cost} token`} />
        <Benefit icon={Check} label={`Thi thử: ${plan.test_start_cost} token`} />
        <Benefit icon={Gift} label={`Bonus: ${plan.daily_trial_bonus} / ngày`} />
        {isPlus && <Benefit icon={Star} label="Ưu tiên tính năng mới" bold />}
      </div>

      <button 
        onClick={onSelect}
        disabled={isCurrent}
        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
          isCurrent 
            ? 'bg-slate-50 text-slate-400 border border-slate-100 cursor-default'
            : isPlus 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
              : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        {isCurrent ? 'Đang sử dụng' : isFree ? 'Dùng mặc định' : 'Chọn gói'}
      </button>
    </motion.div>
  );
}

function Benefit({ icon: Icon, label, bold = false }: { icon: any, label: string, bold?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-indigo-600 flex-shrink-0">
        <Icon size={16} />
      </div>
      <span className={`text-[13px] ${bold ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
        {label}
      </span>
    </div>
  );
}

function FeatureItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-indigo-100 text-indigo-600 p-0.5 rounded-full">
        <Check size={12} strokeWidth={4} />
      </div>
      <span className="text-[13px] font-bold text-slate-700">{label}</span>
    </div>
  );
}

function TrustInfo({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="space-y-3">
      <div className="text-indigo-600">
        <Icon size={24} />
      </div>
      <h4 className="text-sm font-black text-slate-900">{title}</h4>
      <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

