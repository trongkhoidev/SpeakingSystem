import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from '../auth/GoogleLoginButton';

export function ProfessionalModals() {
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isTokenRequired, setIsTokenRequired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleTrialLimit = () => {
      window.speechSynthesis?.cancel();
      setIsLimitReached(true);
    };
    const handleTokenRequired = () => {
      window.speechSynthesis?.cancel();
      setIsTokenRequired(true);
    };

    window.addEventListener('trial-limit-reached', handleTrialLimit);
    window.addEventListener('insufficient-tokens', handleTokenRequired);

    return () => {
      window.removeEventListener('trial-limit-reached', handleTrialLimit);
      window.removeEventListener('insufficient-tokens', handleTokenRequired);
    };
  }, []);

  return (
    <AnimatePresence>
      {/* MODAL: HẾT LƯỢT DÙNG THỬ (GUEST) */}
      {isLimitReached && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
            
            <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto text-amber-600 rotate-3 shadow-inner">
              <Zap className="w-12 h-12 fill-current animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Hết lượt dùng thử!</h2>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                Bạn đã khám phá hết các tính năng dành cho khách. Hãy đăng nhập để tiếp tục luyện tập, lưu lịch sử bài nói và nhận thêm token miễn phí mỗi ngày nhé!
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <GoogleLoginButton />
              <button
                onClick={() => setIsLimitReached(false)}
                className="w-full py-4 text-slate-400 text-[13px] font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Để sau
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* MODAL: HẾT TOKEN (REGISTERED USER) */}
      {isTokenRequired && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto text-blue-600 -rotate-3 shadow-inner">
              <Sparkles className="w-12 h-12 fill-current" />
            </div>

            <div className="space-y-3">
              <h2 className="text-[32px] font-black text-slate-900 tracking-tight leading-tight">Hết Token luyện tập!</h2>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                Hệ thống cần token để thực hiện đánh giá AI chuyên sâu. Bạn có thể nâng cấp gói hội viên hoặc đợi nhận token miễn phí vào ngày mai.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <button
                onClick={() => navigate('/plans')}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
              >
                <BarChart3 className="w-5 h-5" />
                Nâng cấp gói ngay
              </button>
              <button
                onClick={() => setIsTokenRequired(false)}
                className="w-full py-4 text-slate-400 text-[13px] font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
