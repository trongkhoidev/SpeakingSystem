import { BookOpen, ChevronRight } from 'lucide-react';

interface Topic {
  id: number;
  title: string;
  description: string;
  part: number;
}

interface TopicSidebarProps {
  topics: Topic[];
  activeTopicId: number | null;
  onSelectTopic: (id: number) => void;
  isLoading: boolean;
}

export function TopicSidebar({ topics, activeTopicId, onSelectTopic, isLoading }: TopicSidebarProps) {
  if (isLoading) {
    return (
      <div className="w-80 flex flex-col gap-3 shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 flex flex-col gap-3 shrink-0 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 scrollbar-none">
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onSelectTopic(topic.id)}
          className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 text-left ${
            activeTopicId === topic.id
              ? 'bg-primary/20 border-primary ring-1 ring-primary/50'
              : 'bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className={`p-2.5 rounded-xl shrink-0 transition-transform duration-500 group-hover:scale-110 ${
            activeTopicId === topic.id ? 'bg-primary text-white' : 'bg-white/10 text-text-secondary'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-bold text-sm truncate ${activeTopicId === topic.id ? 'text-white' : 'text-text-secondary group-hover:text-white'}`}>
              {topic.title}
            </h4>
            <p className="text-[11px] text-text-secondary font-medium mt-1 line-clamp-2 opacity-60">
              {topic.description}
            </p>
          </div>
          
          <ChevronRight className={`w-4 h-4 mt-1 transition-transform duration-300 ${
            activeTopicId === topic.id ? 'text-primary' : 'text-white/20 group-hover:translate-x-1'
          }`} />
        </button>
      ))}
      
      {topics.length === 0 && (
        <div className="p-8 text-center glass-card">
          <p className="text-sm text-text-secondary italic">Không tìm thấy chủ đề nào</p>
        </div>
      )}
    </div>
  );
}
