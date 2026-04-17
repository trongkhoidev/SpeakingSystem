import { Mic, CheckCircle, Sparkles } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  part: number;
  is_custom: boolean;
  answered?: boolean;
  score?: number;
}

interface QuestionGridProps {
  questions: Question[];
  onSelectQuestion: (question: Question) => void;
  isLoading: boolean;
}

export function QuestionGrid({ questions, onSelectQuestion, isLoading }: QuestionGridProps) {
  if (isLoading) {
    return (
      <>
        {[1,2,3,4,5,6].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 100, animationDelay: `${i*0.06}s`, borderRadius: 10 }}
          />
        ))}
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <div
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '60px 24px',
          background: '#FFFFFF',
          border: '1px dashed #D5DBE5',
          borderRadius: 10,
        }}
      >
        <div style={{ padding: 12, background: '#F5F7FA', borderRadius: 10 }}>
          <Mic size={22} color="#9CA3AF" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: '#6B7280' }}>Chưa có câu hỏi</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Hãy chọn một chủ đề để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {questions.map((question) => (
        <div
          key={question.id}
          className="question-card"
          onClick={() => onSelectQuestion(question)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectQuestion(question)}
        >
          {/* Answered mark */}
          {question.answered && (
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={14} color="#22A06B" />
              {question.score && (
                <span className="badge badge--success">Band {question.score}</span>
              )}
            </div>
          )}

          {/* Question text */}
          <p style={{ fontSize: 13, fontWeight: 500, color: '#1A1D2B', lineHeight: 1.55, paddingRight: question.answered ? 60 : 0 }}>
            {question.text}
          </p>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
            <span className="badge badge--primary">Part {question.part}</span>
            {question.is_custom && (
              <span className="badge badge--purple" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={10} />
                Câu của bạn
              </span>
            )}
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 12px',
                background: '#EEF0FD',
                color: '#3451D1',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <Mic size={11} />
              Luyện ngay
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
