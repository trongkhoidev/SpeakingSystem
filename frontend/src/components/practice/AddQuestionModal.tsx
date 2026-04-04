import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Send, Sparkles } from 'lucide-react';
import api from '../../lib/api';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddQuestionModal({ isOpen, onClose, onSuccess }: AddQuestionModalProps) {
  const [text, setText] = useState('');
  const [part, setPart] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    try {
      await api.post('/questions/custom', {
        text: text.trim(),
        part: Number(part),
        is_custom: true
      });
      setText('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể thêm câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm câu hỏi mới"
      description="Bạn có câu hỏi IELTS nào thú vị? Hãy thêm vào đây để luyện tập nhé!"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">
            Nội dung câu hỏi
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ví dụ: Do you like your hometown?"
            className="w-full min-h-[120px] p-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-text-secondary placeholder:opacity-30 focus:outline-none focus:border-primary/50 transition-all resize-none font-medium"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">
            Phân loại (IELTS Part)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPart(p)}
                className={`py-3 rounded-xl border font-bold transition-all ${
                  part === p 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'
                }`}
              >
                Part {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20 animate-in fade-in zoom-in-95">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Thêm câu hỏi</span>
            </>
          )}
        </button>
        
        <div className="flex items-center gap-2 text-[10px] text-text-secondary font-medium opacity-50 justify-center">
           <Sparkles className="w-3 h-3" />
           <span>Câu hỏi sẽ được lưu riêng cho tài khoản của bạn</span>
        </div>
      </form>
    </Modal>
  );
}
