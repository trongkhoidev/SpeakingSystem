import React from 'react';
import { BookOpen, GraduationCap, Zap, ArrowRight, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function FeatureCards() {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-lg font-semibold font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
        Bắt đầu luyện tập
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Practice Card */}
        <div
          onClick={() => navigate('/practice')}
          className="card p-6 cursor-pointer group transition-all duration-200 hover:border-blue-300"
          style={{ border: '1px solid var(--border-light)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary-bg)' }}
            >
              <BookOpen className="w-5 h-5" style={{ color: 'var(--primary)' }} />
            </div>
            <span className="badge badge--primary text-[10px]">Mỗi ngày</span>
          </div>

          <h3 className="text-base font-semibold font-heading mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Luyện tập theo câu
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Lựa chọn chủ đề IELTS forecast mới nhất, thực hành phát âm và trả lời câu hỏi Part 1, 2, 3.
          </p>

          {/* Part tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { label: 'Part 1', to: '/practice/1' },
              { label: 'Part 2', to: '/practice/2' },
              { label: 'Part 3', to: '/practice/3' },
              { label: 'Câu của bạn', to: '/practice/custom' },
            ].map((tag) => (
              <button
                key={tag.label}
                onClick={(e) => { e.stopPropagation(); navigate(tag.to); }}
                className="text-xs font-medium px-3 py-1 rounded-full transition-colors"
                style={{
                  background: 'var(--bg-body)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--primary-bg)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--primary-text)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-body)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)';
                }}
              >
                {tag.label}
              </button>
            ))}
          </div>

          <div
            className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
            style={{ color: 'var(--primary)' }}
          >
            <Mic className="w-4 h-4" />
            Thực hành ngay
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Test Card */}
        <div
          onClick={() => navigate('/test')}
          className="card p-6 cursor-pointer group transition-all duration-200 hover:border-purple-300"
          style={{ border: '1px solid var(--border-light)' }}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F3F0FF' }}
            >
              <GraduationCap className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <span className="badge badge--purple text-[10px]">AI Examiner</span>
          </div>

          <h3 className="text-base font-semibold font-heading mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Thi thử IELTS
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Mô phỏng kỳ thi thật với Examiner AI. Nhận báo cáo chi tiết về Band score và chiến lược nâng điểm.
          </p>

          {/* Info row */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-4"
            style={{ background: 'var(--bg-body)', border: '1px solid var(--border-light)' }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: '#F3F0FF' }}
            >
              <Zap className="w-4 h-4" style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Full Mock Test</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>15 – 20 phút</p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all"
            style={{ color: '#7C3AED' }}
          >
            <GraduationCap className="w-4 h-4" />
            Bắt đầu thi thử
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
