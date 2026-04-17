import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Flame, TrendingUp, ArrowRight, Mic, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { ContributionHeatmap } from '../components/dashboard/ContributionHeatmap';

export function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/user/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error('Dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, flexDirection: 'column' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E8ECF1', borderTopColor: '#4361EE', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ fontSize: 12, color: '#9CA3AF' }}>Đang tải dữ liệu...</p>
      </div>
    );
  }

  const streak  = data?.streak ?? 0;
  const band    = data?.bandEstimate?.current ?? 0;
  const change  = data?.bandEstimate?.change ?? 0;
  const done    = data?.dailyMission?.completed ?? 0;
  const total   = data?.dailyMission?.total ?? 5;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="page-enter">
      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
          Chào mừng trở lại! 👋
        </h1>
        <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 4 }}>
          Hôm nay bạn đã sẵn sàng nâng band IELTS chưa?
        </p>
      </div>

      {/* ── Stats Grid (4 cards) ── */}
      <section className="page-section">
        <p className="section-title">Tổng quan hôm nay</p>
        <div className="stats-grid">

          {/* Streak */}
          <div className="card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 9, borderRadius: 9, background: '#FFF7E6' }}>
                <Flame size={18} color="#B45309" fill="#B45309" />
              </div>
              <span className="badge badge--warning">🔥 Streak</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#1A1D2B', lineHeight: 1 }}>{streak}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>ngày liên tiếp</div>
          </div>

          {/* Band */}
          <div className="card hover-lift" style={{ borderTop: '2px solid #4361EE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 9, borderRadius: 9, background: '#EEF0FD' }}>
                <TrendingUp size={18} color="#4361EE" />
              </div>
              <span
                style={{ fontSize: 11, fontWeight: 600, color: change >= 0 ? '#1A8F5C' : '#DC2626' }}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(1)} tháng này
              </span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#4361EE', lineHeight: 1 }}>{band.toFixed(1)}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Band ước tính</div>
          </div>

          {/* Daily mission */}
          <div className="card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 9, borderRadius: 9, background: '#E6F9F0' }}>
                <Zap size={18} color="#1A8F5C" />
              </div>
              <span className="badge badge--success">{pct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1A1D2B', lineHeight: 1 }}>{done}<span style={{ fontSize: 16, color: '#9CA3AF' }}>/{total}</span></div>
            <div style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 8px' }}>Câu hôm nay</div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${pct}%`, background: '#1A8F5C' }} />
            </div>
          </div>

          {/* Tips */}
          <div className="card hover-lift">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ padding: 9, borderRadius: 9, background: '#F3F0FF' }}>
                <Mic size={18} color="#6D28D9" />
              </div>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1D2B' }}>Luyện tập ngay</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Cải thiện phát âm với AI</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 12, width: '100%', fontSize: 12 }}
              onClick={() => navigate('/practice')}
            >
              Bắt đầu <ArrowRight size={13} />
            </button>
          </div>

        </div>
      </section>

      {/* ── Feature cards (2 columns) ── */}
      <section className="page-section">
        <p className="section-title">Tính năng chính</p>
        <div className="feature-grid">

          <div
            className="card hover-lift"
            style={{ cursor: 'pointer', borderLeft: '3px solid #4361EE' }}
            onClick={() => navigate('/practice')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 10, background: '#EEF0FD', flexShrink: 0 }}>
                <BookOpen size={20} color="#4361EE" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
                  Luyện tập theo câu
                </div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4, lineHeight: 1.55 }}>
                  Thực hành phát âm và trả lời câu hỏi IELTS Part 1, 2, 3 với AI Examiner.
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {['Part 1', 'Part 2', 'Part 3'].map(t => (
                    <span key={t} className="badge badge--primary">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className="card hover-lift"
            style={{ cursor: 'pointer', borderLeft: '3px solid #7C3AED' }}
            onClick={() => navigate('/test')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ padding: 10, borderRadius: 10, background: '#F3F0FF', flexShrink: 0 }}>
                <GraduationCap size={20} color="#7C3AED" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
                  Thi thử IELTS
                </div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4, lineHeight: 1.55 }}>
                  Mô phỏng kỳ thi thật. Nhận báo cáo Band score và chiến lược nâng điểm.
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="badge badge--purple">AI Examiner · 15–20 phút</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Heatmap ── */}
      <section className="page-section">
        <p className="section-title">Lịch sử học tập</p>
        <ContributionHeatmap data={data?.heatmap ?? []} />
      </section>

      {/* Footer quote */}
      <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', paddingBottom: 8 }}>
        "The expert in anything was once a beginner." — Helen Hayes
      </p>
    </div>
  );
}
