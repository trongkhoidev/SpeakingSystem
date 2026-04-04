import { useEffect, useState } from 'react';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger
} from '@/components/ui/Tabs';
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

export function PracticeModePage() {
  const { user } = useAuth();
  if (user) console.debug("User authenticated:", user.email);
  const [activeTab, setActiveTab] = useState('part1');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Recording Modal State
  const [isRecordingModalOpen, setIsRecordingModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const fetchQuestions = async (topicId: number | null) => {
    if (topicId === null) return;
    
    setLoadingQuestions(true);
    try {
      if (topicId === -1) {
        // Special case for custom questions
        const response = await api.get('/questions/custom');
        setQuestions(response.data);
      } else {
        const response = await api.get(`/topics/${topicId}/questions`);
        setQuestions(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    const fetchTopics = async () => {
      if (activeTab === 'custom') {
        setTopics([]); // Custom tab has no topics, just a direct list of questions
        setActiveTopicId(-1); // special ID for custom questions
        return;
      }

      setLoadingTopics(true);
      try {
        const part = activeTab === 'part1' ? 1 : activeTab === 'part2' ? 2 : activeTab === 'part3' ? 3 : 0;
        const response = await api.get(`/topics?part=${part}`);
        setTopics(response.data);
        if (response.data.length > 0) {
          setActiveTopicId(response.data[0].id);
        } else {
          setActiveTopicId(null);
          setQuestions([]);
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopics();
  }, [activeTab]);

  useEffect(() => {
    fetchQuestions(activeTopicId);
  }, [activeTopicId]);

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsRecordingModalOpen(true);
  };

  const handleAddSuccess = () => {
    if (activeTab === 'custom') {
      fetchQuestions(-1);
    } else {
      setActiveTab('custom');
    }
  };

  const handleRecordingSuccess = (result: any) => {
    console.log("Assessment result received in Practice page:", result);
    // Any final state updates in the page if needed
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black font-heading text-white tracking-tight drop-shadow-sm">
            Luyện tập theo câu
          </h1>
          <p className="text-text-secondary mt-2 text-lg font-medium opacity-80">
            Cải thiện từng kỹ năng Speaking với ngân hàng câu hỏi đa dạng
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold hover:bg-indigo-500/20 transition-all hover-lift glass-card ring-1 ring-white/5"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm câu hỏi mới</span>
          </button>
          
          <button className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/5 text-text-secondary border border-white/10 font-bold hover:bg-white/[0.08] transition-all hover-lift">
            <History className="w-5 h-5" />
            <span>Lịch sử</span>
          </button>
        </div>
      </header>

      <Tabs defaultValue="part1" onValueChange={setActiveTab} className="bg-transparent border-none">
        <TabsList className="bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md mb-8">
          <TabsTrigger value="part1" className="px-8 py-3 font-extrabold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 tracking-wider uppercase text-[11px]">Part 1: Introduction</TabsTrigger>
          <TabsTrigger value="part2" className="px-8 py-3 font-extrabold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 tracking-wider uppercase text-[11px]">Part 2: Cue Card</TabsTrigger>
          <TabsTrigger value="part3" className="px-8 py-3 font-extrabold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 tracking-wider uppercase text-[11px]">Part 3: Discussion</TabsTrigger>
          <TabsTrigger value="custom" className="px-8 py-3 font-extrabold rounded-xl data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all duration-500 tracking-wider uppercase text-[11px]">Câu bạn thêm</TabsTrigger>
        </TabsList>

        <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[60vh]">
          <TopicSidebar 
            topics={topics} 
            activeTopicId={activeTopicId} 
            onSelectTopic={setActiveTopicId} 
            isLoading={loadingTopics} 
          />
          
          <QuestionGrid 
            questions={questions} 
            onSelectQuestion={handleSelectQuestion} 
            isLoading={loadingQuestions} 
          />
        </div>
      </Tabs>

      <AddQuestionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleAddSuccess} 
      />

      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        question={selectedQuestion}
        onSuccess={handleRecordingSuccess}
      />
    </div>
  );
}
