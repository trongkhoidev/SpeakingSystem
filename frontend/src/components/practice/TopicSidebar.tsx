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
      <div className="practice-topics">
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', padding: '4px 2px 8px' }}>
          Đang tải chủ đề...
        </div>
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="skeleton" style={{ height: 62, animationDelay: `${i*0.06}s` }} />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="practice-topics">
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            background: '#F5F7FA',
            borderRadius: 8,
            border: '1px dashed #D5DBE5',
          }}
        >
          <BookOpen size={20} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: 12, color: '#9CA3AF' }}>Không có chủ đề</p>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-topics">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF', padding: '0 2px 8px' }}>
        Chủ đề ({topics.length})
      </div>

      {topics.map((topic) => {
        const isActive = activeTopicId === topic.id;
        return (
          <button
            key={topic.id}
            className={`topic-item${isActive ? ' active' : ''}`}
            onClick={() => onSelectTopic(topic.id)}
          >
            <div
              style={{
                padding: '7px',
                borderRadius: 7,
                background: isActive ? 'rgba(67,97,238,0.15)' : '#F0F2F5',
                color: isActive ? '#4361EE' : '#9CA3AF',
                flexShrink: 0,
              }}
            >
              <BookOpen size={13} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isActive ? '#3451D1' : '#1A1D2B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {topic.title}
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {topic.description}
              </div>
            </div>
            <ChevronRight
              size={13}
              color={isActive ? '#4361EE' : '#D5DBE5'}
              style={{ flexShrink: 0, transition: 'transform 0.15s' }}
            />
          </button>
        );
      })}
    </div>
  );
}
