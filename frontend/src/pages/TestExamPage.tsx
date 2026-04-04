import { useState, useEffect } from 'react';
import { 
  Settings2, 
  Plus, 
  ChevronRight, 
  Calendar, 
  Award
} from 'lucide-react';
import { Button } from '../components/shared/Button';
import { BandBadge } from '../components/shared/BandBadge';
import { TestSetupModal, TestConfig } from '../components/test/TestSetupModal';
import { TestRunner } from '../components/test/TestRunner';
import { TestReport } from '../components/test/TestReport';
import api from '@/lib/api';
import { Zap, FileText, TrendingUp, History } from 'lucide-react';

interface TestHistoryItem {
  id: string;
  created_at: string;
  mode: string;
  overall_band: number;
}

export function TestExamPage() {
  const [history, setHistory] = useState<TestHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'full' | 'part1' | 'part2' | 'part3'>('full');
  
  // Active Test State
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [showReport, setShowReport] = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/test/history');
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (config: TestConfig) => {
    try {
      const response = await api.post('/test/start', {
        mode: selectedMode,
        config: config
      });
      setActiveSession(response.data.session);
      setQuestions(response.data.questions);
      setTestConfig(config);
      setIsSetupOpen(false);
    } catch (error) {
      console.error("Failed to start test:", error);
    }
  };

  const handleTestFinish = async () => {
    if (!activeSession) return;
    try {
      const response = await api.get(`/test/${activeSession.id}/report`);
      setShowReport(response.data);
      setActiveSession(null);
      fetchHistory();
    } catch (error) {
      console.error("Failed to fetch report:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const examModes = [
    {
      id: 'full',
      title: 'Full Test',
      description: 'Luyện tập trọn bộ 3 phần như thi thật (11-14 phút).',
      icon: <Award className="w-8 h-8 text-yellow-400" />,
      color: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      id: 'part1',
      title: 'Part 1',
      description: 'Phỏng vấn ngắn về các chủ đề quen thuộc (4-5 phút).',
      icon: <Zap className="w-8 h-8 text-blue-400" />,
      color: 'from-blue-500/20 to-indigo-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'part2',
      title: 'Part 2',
      description: 'Nói về một chủ đề trong Cue Card (3-4 phút).',
      icon: <FileText className="w-8 h-8 text-purple-400" />,
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      id: 'part3',
      title: 'Part 3',
      description: 'Thảo luận chuyên sâu về các vấn đề xã hội (4-5 phút).',
      icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    }
  ];

  const openSetup = (mode: 'full' | 'part1' | 'part2' | 'part3' = 'full') => {
    setSelectedMode(mode);
    setIsSetupOpen(true);
  };

  if (activeSession && questions.length > 0 && testConfig) {
    return (
      <div className="py-10">
        <TestRunner 
          sessionId={activeSession.id}
          config={testConfig}
          questions={questions}
          onComplete={handleTestFinish}
        />
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <Button variant="glass" onClick={() => setShowReport(null)}>
            Quay lại danh sách
          </Button>
          <div className="text-sm font-bold text-text-muted uppercase tracking-widest">
            Báo cáo chi tiết bài thi
          </div>
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

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-black font-heading text-white tracking-tight">
            Thi thử <span className="gradient-text">IELTS Speaking</span>
          </h1>
          <p className="text-text-secondary mt-2 text-lg font-medium opacity-80 max-w-2xl">
            Mô phỏng chính xác môi trường phòng thi thực tế với giám khảo AI và bộ câu hỏi cập nhật theo dự đoán.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="glass" className="gap-2 border-white/10 hover:bg-white/5">
            <Settings2 className="w-4 h-4" />
            Cài đặt giọng đọc
          </Button>
          <Button 
            onClick={() => openSetup()}
            className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Tạo bài thi mới
          </Button>
        </div>
      </header>

      {/* Exam Modes Grid */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-primary rounded-full"></div>
          <h2 className="text-xl font-bold font-heading text-white">Chọn chế độ thi</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {examModes.map((mode) => (
            <button 
              key={mode.id}
              onClick={() => openSetup(mode.id as any)}
              className={`glass-card p-6 text-left group relative overflow-hidden border-2 ${mode.borderColor} hover:scale-[1.02] active:scale-[0.98] transition-all duration-300`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <div className="relative z-10 flex flex-col h-full space-y-4">
                <div className="p-3 bg-white/5 rounded-2xl w-fit group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                  {mode.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{mode.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed group-hover:text-white/80 transition-colors">
                    {mode.description}
                  </p>
                </div>
                <div className="mt-auto pt-4 flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                  Bắt đầu ngay <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* History Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
            <h2 className="text-xl font-bold font-heading text-white">Lịch sử thi thử</h2>
          </div>
          <Button variant="glass" size="sm" className="text-xs border-white/5 hover:bg-white/5">
            Xem tất cả
          </Button>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-text-secondary font-medium">Đang tải lịch sử...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Ngày thi</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Chế độ</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted text-center">Kết quả</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-text-muted"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/5 rounded-lg text-text-secondary">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {new Date(item.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-text-muted">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                          {item.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-success text-xs font-bold uppercase tracking-widest">
                          Completed
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <BandBadge score={item.overall_band || 0} size="sm" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={async () => {
                            const response = await api.get(`/test/${item.id}/report`);
                            setShowReport(response.data);
                          }}
                          className="p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-text-muted">
                <History className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chưa có bài thi nào</h3>
              <p className="text-text-secondary max-w-sm mx-auto leading-relaxed">
                Thực hiện bài thi thử đầu tiên để đánh giá trình độ và nhận lộ trình cải thiện từ AI.
              </p>
              <Button className="mt-8 gap-2" onClick={() => openSetup()}>
                Bắt đầu ngay
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Pro Tips / Motivation */}
      <div className="p-8 glass-card border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Award className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-2">Mẹo phòng thi: Sự tự tin là chìa khóa</h3>
          <p className="text-text-secondary leading-relaxed">
            Trong IELTS Speaking, không có câu trả lời đúng hay sai. Hãy thoải mái chia sẻ trải nghiệm của bạn và sử dụng đa dạng cấu trúc ngữ pháp để "khoe" vốn ngôn ngữ nhé!
          </p>
        </div>
        <Button variant="glass" className="whitespace-nowrap border-primary/30 text-primary hover:bg-primary/5">
          Xem tài liệu ôn tập
        </Button>
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
