import { useEffect, useState } from 'react';
import { TopicSidebar } from '../components/practice/TopicSidebar';
import { QuestionGrid } from '../components/practice/QuestionGrid';
import { Plus, History } from 'lucide-react';
import api from '../lib/api';
import { AddQuestionModal } from '../components/practice/AddQuestionModal';
import { RecordingModal } from '../components/audio/RecordingModal';
import { useAuth } from '@/lib/auth-context';

interface Topic {
  id: number;
  title: string;
  description: string;
  part: number;
}

interface Question {
  id: string;
  text: string;
  part: number;
  is_custom: boolean;
  answered?: boolean;
}

const TABS = [
  { id: 'part1',  label: 'Part 1 · Giới thiệu' },
  { id: 'part2',  label: 'Part 2 · Cue Card' },
  { id: 'part3',  label: 'Part 3 · Thảo luận' },
  { id: 'custom', label: 'Câu bạn thêm' },
];

export function PracticeModePage() {
  const { user } = useAuth();
  if (user) console.debug('Auth:', user.email);

  const [activeTab, setActiveTab]           = useState('part1');
  const [topics, setTopics]                 = useState<Topic[]>([]);
  const [activeTopicId, setActiveTopicId]   = useState<number | null>(null);
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [loadingTopics, setLoadingTopics]   = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const fetchQuestions = async (topicId: number | null) => {
    if (topicId === null) return;
    setLoadingQuestions(true);
    try {
      const res = topicId === -1
        ? await api.get('/questions/custom')
        : await api.get(`/topics/${topicId}/questions`);
      setQuestions(res.data);
    } catch (e) {
      console.error('Failed to fetch questions:', e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      if (activeTab === 'custom') {
        setTopics([]);
        setActiveTopicId(-1);
        return;
      }
      setLoadingTopics(true);
      try {
        const part = activeTab === 'part1' ? 1 : activeTab === 'part2' ? 2 : 3;
        const res = await api.get(`/topics?part=${part}`);
        setTopics(res.data);
        setActiveTopicId(res.data.length > 0 ? res.data[0].id : null);
        if (res.data.length === 0) setQuestions([]);
      } catch (e) {
        console.error('Failed to fetch topics:', e);
      } finally {
        setLoadingTopics(false);
      }
    };
    fetchTopics();
  }, [activeTab]);

  useEffect(() => { fetchQuestions(activeTopicId); }, [activeTopicId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Luyện tập theo câu
          </h1>
          <p style={{ fontSize: 13.5, color: '#6B7280', marginTop: 4 }}>
            Cải thiện từng kỹ năng Speaking với ngân hàng câu hỏi đa dạng
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={15} />
            Thêm câu hỏi
          </button>
          <button className="btn btn-ghost">
            <History size={15} />
            Lịch sử
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Practice layout: Topics sidebar + Questions grid */}
      <div className="practice-layout">
        {activeTab !== 'custom' && (
          <TopicSidebar
            topics={topics}
            activeTopicId={activeTopicId}
            onSelectTopic={setActiveTopicId}
            isLoading={loadingTopics}
          />
        )}

        <div
          className="practice-questions"
          style={activeTab === 'custom' ? { gridTemplateColumns: 'repeat(3, 1fr)' } : undefined}
        >
          <QuestionGrid
            questions={questions}
            onSelectQuestion={(q) => { setSelectedQuestion(q); setIsRecordingModalOpen(true); }}
            isLoading={loadingQuestions}
          />
        </div>
      </div>

      {/* Modals */}
      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          if (activeTab === 'custom') fetchQuestions(-1);
          else setActiveTab('custom');
        }}
      />

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        question={selectedQuestion}
        onSuccess={(result) => console.log('Assessment:', result)}
      />
    </div>
  );
}
