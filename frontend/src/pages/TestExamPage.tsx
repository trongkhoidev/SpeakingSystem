import { useState, useEffect } from 'react';
import {
  Settings2, Plus, ChevronRight, Calendar, Award,
  Zap, FileText, TrendingUp, History, ArrowRight, Lightbulb
} from 'lucide-react';
import { TestSetupModal, TestConfig } from '../components/test/TestSetupModal';
import { TestRunner } from '../components/test/TestRunner';
import { TestReport } from '../components/test/TestReport';
import { BandBadge } from '../components/shared/BandBadge';
import api from '@/lib/api';

interface TestHistoryItem {
  id: string;
  created_at: string;
  mode: string;
  overall_band: number;
}

/* ── Exam mode card data ── */
const EXAM_MODES = [
  {
    id: 'full' as const,
    title: 'Full Test',
    description: 'Luyện tập trọn bộ 3 phần như thi thật (11–14 phút).',
    icon: Award,
    iconColor: '#B45309',
    iconBg: '#FFF7E6',
    accentColor: '#F59E0B',
  },
  {
    id: 'part1' as const,
    title: 'Part 1',
    description: 'Phỏng vấn ngắn về các chủ đề quen thuộc (4–5 phút).',
    icon: Zap,
    iconColor: '#4361EE',
    iconBg: '#EEF0FD',
    accentColor: '#4361EE',
  },
  {
    id: 'part2' as const,
    title: 'Part 2',
    description: 'Nói về một chủ đề trong Cue Card (3–4 phút).',
    icon: FileText,
    iconColor: '#7C3AED',
    iconBg: '#F3F0FF',
    accentColor: '#7C3AED',
  },
  {
    id: 'part3' as const,
    title: 'Part 3',
    description: 'Thảo luận chuyên sâu về các vấn đề xã hội (4–5 phút).',
    icon: TrendingUp,
    iconColor: '#1A8F5C',
    iconBg: '#E6F9F0',
    accentColor: '#22A06B',
  },
];

type ExamModeId = 'full' | 'part1' | 'part2' | 'part3';

export function TestExamPage() {
  const [history, setHistory]               = useState<TestHistoryItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [isSetupOpen, setIsSetupOpen]       = useState(false);
  const [selectedMode, setSelectedMode]     = useState<ExamModeId>('full');
  const [activeSession, setActiveSession]   = useState<any | null>(null);
  const [questions, setQuestions]           = useState<any[]>([]);
  const [testConfig, setTestConfig]         = useState<TestConfig | null>(null);
  const [showReport, setShowReport]         = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/test/history');
      setHistory(res.data);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (config: TestConfig) => {
    try {
      const res = await api.post('/test/start', { mode: selectedMode, config });
      setActiveSession(res.data.session);
      setQuestions(res.data.questions);
      setTestConfig(config);
      setIsSetupOpen(false);
    } catch (e) {
      console.error('Failed to start test:', e);
    }
  };

  const handleTestFinish = async () => {
    if (!activeSession) return;
    try {
      const res = await api.get(`/test/${activeSession.id}/report`);
      setShowReport(res.data);
      setActiveSession(null);
      fetchHistory();
    } catch (e) {
      console.error('Failed to fetch report:', e);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const openSetup = (mode: ExamModeId = 'full') => {
    setSelectedMode(mode);
    setIsSetupOpen(true);
  };

  /* ── Test running state ── */
  if (activeSession && questions.length > 0 && testConfig) {
    return (
      <div style={{ padding: '20px 0' }}>
        <TestRunner
          sessionId={activeSession.id}
          config={testConfig}
          questions={questions}
          onComplete={handleTestFinish}
        />
      </div>
    );
  }

  /* ── Report state ── */
  if (showReport) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowReport(null)}
          >
            ← Quay lại danh sách
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Báo cáo chi tiết bài thi
          </span>
        </div>
        <TestReport
          date={showReport.date}
          overallBand={showReport.overallBand}
          type={showReport.type}
          results={showReport.results}
        />
      </div>
    );
  }

  /* ── Main view ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="page-enter">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Thi thử <span style={{ color: '#4361EE' }}>IELTS Speaking</span>
          </h1>
          <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 5, maxWidth: 560 }}>
            Mô phỏng chính xác môi trường phòng thi thực tế với giám khảo AI và bộ câu hỏi cập nhật theo dự đoán.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-ghost">
            <Settings2 size={15} />
            Cài đặt giọng đọc
          </button>
          <button className="btn btn-primary" onClick={() => openSetup()}>
            <Plus size={15} />
            Tạo bài thi mới
          </button>
        </div>
      </div>

      {/* ── Exam mode cards (4 columns) ── */}
      <section>
        <p className="section-title">Chọn chế độ thi</p>
        <div className="stats-grid">
          {EXAM_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => openSetup(mode.id)}
              className="card hover-lift"
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                borderTop: `2px solid ${mode.accentColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: '18px 20px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = mode.accentColor;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${mode.accentColor}20`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: mode.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <mode.icon size={22} color={mode.iconColor} />
              </div>

              {/* Text */}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
                  {mode.title}
                </div>
                <div style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.55 }}>
                  {mode.description}
                </div>
              </div>

              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 'auto',
                  padding: '8px 16px',
                  background: mode.iconBg,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: mode.iconColor,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                Bắt đầu ngay
                <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── History section ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>Lịch sử thi thử</p>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>
            Xem tất cả
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E8ECF1', borderTopColor: '#4361EE', animation: 'spin 0.9s linear infinite' }} />
              <p style={{ fontSize: 12.5, color: '#9CA3AF' }}>Đang tải lịch sử...</p>
            </div>

          ) : history.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8ECF1', background: '#F8F9FB' }}>
                  {['Ngày thi', 'Chế độ', 'Trạng thái', 'Kết quả', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '10px 16px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textAlign: i === 3 ? 'center' : i === 4 ? 'right' : 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx < history.length - 1 ? '1px solid #F0F2F5' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#FAFBFF'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ padding: 7, background: '#F0F2F5', borderRadius: 7 }}>
                          <Calendar size={13} color="#6B7280" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1D2B' }}>
                            {new Date(item.created_at).toLocaleDateString('vi-VN')}
                          </div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge--primary" style={{ textTransform: 'uppercase' }}>
                        {item.mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge--success">Hoàn thành</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <BandBadge score={item.overall_band || 0} size="sm" />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          const res = await api.get(`/test/${item.id}/report`);
                          setShowReport(res.data);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#EEF0FD',
                          color: '#4361EE',
                          border: 'none',
                          borderRadius: 7,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginLeft: 'auto',
                        }}
                      >
                        Xem báo cáo <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          ) : (
            /* ── Empty state ── */
            <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: '#F0F2F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={28} color="#9CA3AF" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1D2B', marginBottom: 6 }}>
                  Chưa có bài thi nào
                </div>
                <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 320 }}>
                  Thực hiện bài thi thử đầu lên để đánh giá trình độ và lộ trình cải thiện từ AI.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => openSetup()} style={{ marginTop: 4 }}>
                Bắt đầu ngay →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Pro tip banner ── */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '18px 24px',
          borderLeft: '3px solid #4361EE',
          background: '#F8F9FE',
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            background: '#EEF0FD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Lightbulb size={20} color="#4361EE" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A1D2B', marginBottom: 4 }}>
            Mẹo phòng thi: Sự tự tin là chìa khóa
          </div>
          <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.6 }}>
            Trong IELTS Speaking, không có câu trả lời đúng hay sai. Hãy thoải mái chia sẻ trải nghiệm của bạn và sử dụng đa dạng cấu trúc ngữ pháp để "khoe" vốn ngôn ngữ nhé!
          </p>
        </div>
        <button className="btn btn-ghost" style={{ flexShrink: 0, fontSize: 12.5 }}>
          Xem tài liệu ôn tập
        </button>
      </div>

      <TestSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStart={startTest}
        initialMode={selectedMode}
      />
    </div>
  );
}
