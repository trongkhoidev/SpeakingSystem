import { useEffect, useState, useCallback } from 'react';
import {
  FileText, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Check, X, Tag, Clock, BarChart3, Eye, EyeOff, Search, Filter
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface QuestionPreview {
  id: string;
  text: string;
  part: number;
}

interface ExamSetData {
  id: string;
  name: string;
  description: string;
  estimated_minutes: number;
  difficulty: string;
  is_active: boolean;
  tag: string | null;
  question_ids_json: string;
  questions_preview: {
    part1: QuestionPreview[];
    part2: QuestionPreview[];
    part3: QuestionPreview[];
  };
  question_counts: { part1: number; part2: number; part3: number };
  created_at: string;
}

interface BankQuestion {
  id: string;
  part: number;
  question_text: string;
  topic: string | null;
  cue_card_json: string | null;
}

const DIFF_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  easy: { bg: '#ECFDF5', text: '#059669', label: 'Easy' },
  medium: { bg: '#EFF6FF', text: '#2563EB', label: 'Medium' },
  hard: { bg: '#FEF2F2', text: '#DC2626', label: 'Hard' },
};

export function ExamSetManagementPage() {
  const [activeTab, setActiveTab] = useState<'sets' | 'bank'>('sets');
  const [examSets, setExamSets] = useState<ExamSetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for Exam Set
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiff, setFormDiff] = useState('medium');
  const [formTag, setFormTag] = useState('');
  const [formMinutes, setFormMinutes] = useState(14);
  const [formActive, setFormActive] = useState(true);

  // Question bank state
  const [questionBank, setQuestionBank] = useState<BankQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<{ part1: string[]; part2: string[]; part3: string[] }>({
    part1: [], part2: [], part3: []
  });
  const [bankFilter, setBankFilter] = useState<1 | 2 | 3>(1);
  const [bankSearch, setBankSearch] = useState('');

  // Question Form state (for bank management)
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qFormText, setQFormText] = useState('');
  const [qFormPart, setQFormPart] = useState<number>(1);
  const [qFormTopicId, setQFormTopicId] = useState('');
  const [topics, setTopics] = useState<any[]>([]);

  const fetchExamSets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/exam-sets');
      setExamSets(res.data);
    } catch (e) {
      console.error('Failed to fetch exam sets:', e);
      toast.error('Không thể tải danh sách bộ đề');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuestionBank = useCallback(async () => {
    try {
      const res = await api.get('/admin/questions/bank');
      setQuestionBank(res.data);
    } catch (e) {
      console.error('Failed to fetch question bank:', e);
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get('/admin/topics');
      setTopics(res.data);
    } catch (e) { }
  }, []);

  useEffect(() => {
    fetchExamSets();
    fetchQuestionBank();
    fetchTopics();
  }, [fetchExamSets, fetchQuestionBank, fetchTopics]);

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormDiff('medium');
    setFormTag('');
    setFormMinutes(14);
    setFormActive(true);
    setSelectedQuestions({ part1: [], part2: [], part3: [] });
    setEditingId(null);
    setShowCreateForm(false);
  };

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error('Tên bộ đề không được để trống');
      return;
    }
    try {
      await api.post('/admin/exam-sets', {
        name: formName,
        description: formDesc,
        difficulty: formDiff,
        tag: formTag || null,
        estimated_minutes: formMinutes,
        is_active: formActive,
        question_ids: selectedQuestions
      });
      toast.success('Tạo bộ đề thành công!');
      resetForm();
      fetchExamSets();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Lỗi tạo bộ đề');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/admin/exam-sets/${id}`, {
        name: formName,
        description: formDesc,
        difficulty: formDiff,
        tag: formTag || null,
        estimated_minutes: formMinutes,
        is_active: formActive,
        question_ids: selectedQuestions
      });
      toast.success('Cập nhật bộ đề thành công!');
      resetForm();
      fetchExamSets();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Lỗi cập nhật');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bộ đề này?')) return;
    try {
      await api.delete(`/admin/exam-sets/${id}`);
      toast.success('Đã xóa bộ đề');
      fetchExamSets();
    } catch (e) {
      toast.error('Lỗi xóa bộ đề');
    }
  };

  const handleToggleActive = async (es: ExamSetData) => {
    try {
      await api.put(`/admin/exam-sets/${es.id}`, { is_active: !es.is_active });
      toast.success(es.is_active ? 'Đã ẩn bộ đề' : 'Đã kích hoạt bộ đề');
      fetchExamSets();
    } catch (e) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  // Question Management Logic
  const handleSaveQuestion = async () => {
    if (!qFormText.trim()) return toast.error('Nội dung câu hỏi không được để trống');

    try {
      if (editingQuestionId) {
        // Single update
        const payload = {
          question_text: qFormText,
          part: qFormPart,
          topic_id: qFormTopicId || null
        };
        await api.put(`/admin/questions/bank/${editingQuestionId}`, payload);
        toast.success('Đã cập nhật câu hỏi');
      } else {
        // New question(s)
        const lines = qFormText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length > 1) {
          // Batch upload
          const res = await api.post('/admin/questions/bank/batch', {
            questions: lines,
            part: qFormPart,
            topic_id: qFormTopicId || null
          });
          toast.success(res.data.message);
        } else {
          // Single upload
          await api.post('/admin/questions/bank', {
            question_text: lines[0],
            part: qFormPart,
            topic_id: qFormTopicId || null
          });
          toast.success('Đã thêm câu hỏi vào ngân hàng');
        }
      }

      setShowQuestionForm(false);
      setEditingQuestionId(null);
      setQFormText('');
      fetchQuestionBank();
    } catch (e) {
      toast.error('Lỗi lưu câu hỏi');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Xóa câu hỏi này khỏi ngân hàng?')) return;
    try {
      await api.delete(`/admin/questions/bank/${id}`);
      toast.success('Đã xóa');
      fetchQuestionBank();
    } catch (e) {
      toast.error('Lỗi xóa');
    }
  };

  const startEdit = (es: ExamSetData) => {
    setEditingId(es.id);
    setFormName(es.name);
    setFormDesc(es.description);
    setFormDiff(es.difficulty);
    setFormTag(es.tag || '');
    setFormMinutes(es.estimated_minutes);
    setFormActive(es.is_active);
    try {
      setSelectedQuestions(JSON.parse(es.question_ids_json));
    } catch {
      setSelectedQuestions({ part1: [], part2: [], part3: [] });
    }
    setShowCreateForm(true);
  };

  const toggleQuestion = (qId: string, part: number) => {
    const key = `part${part}` as keyof typeof selectedQuestions;
    setSelectedQuestions(prev => ({
      ...prev,
      [key]: prev[key].includes(qId)
        ? prev[key].filter(id => id !== qId)
        : [...prev[key], qId]
    }));
  };

  const filteredBank = questionBank
    .filter(q => q.part === bankFilter)
    .filter(q => !bankSearch || q.question_text.toLowerCase().includes(bankSearch.toLowerCase()));

  const totalSelected = selectedQuestions.part1.length + selectedQuestions.part2.length + selectedQuestions.part3.length;

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Header & Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Quản lý Nội dung thi 📝
          </h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <button
              onClick={() => setActiveTab('sets')}
              style={{
                background: 'none', border: 'none', borderBottom: activeTab === 'sets' ? '2px solid #4361EE' : 'none',
                color: activeTab === 'sets' ? '#4361EE' : '#94A3B8', fontWeight: 700, padding: '4px 0', cursor: 'pointer', fontSize: 14
              }}
            >
              Danh sách Bộ đề
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              style={{
                background: 'none', border: 'none', borderBottom: activeTab === 'bank' ? '2px solid #4361EE' : 'none',
                color: activeTab === 'bank' ? '#4361EE' : '#94A3B8', fontWeight: 700, padding: '4px 0', cursor: 'pointer', fontSize: 14
              }}
            >
              Ngân hàng Câu hỏi (Smart Random)
            </button>
          </div>
        </div>

        {activeTab === 'sets' ? (
          <button
            onClick={() => { resetForm(); setShowCreateForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
              background: '#4361EE', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(67, 97, 238, 0.3)'
            }}
          >
            <Plus size={16} /> Tạo bộ đề mới
          </button>
        ) : (
          <button
            onClick={() => { setEditingQuestionId(null); setQFormText(''); setShowQuestionForm(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
              background: '#10B981', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Plus size={16} /> Thêm câu hỏi
          </button>
        )}
      </div>

      {activeTab === 'sets' ? (
        <>
          {/* Create/Edit Set Form */}
          {showCreateForm && (
            <div className="animate-slide-down" style={{
              background: '#fff', borderRadius: 20, padding: 28, border: '2px solid #4361EE',
              boxShadow: '0 8px 30px rgba(67, 97, 238, 0.1)'
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A1D2B', marginBottom: 20 }}>
                {editingId ? '✏️ Chỉnh sửa bộ đề' : '➕ Tạo bộ đề mới'}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Tên bộ đề *</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="VD: Set 11: Travel & Culture"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Tag</label>
                  <input
                    value={formTag}
                    onChange={e => setFormTag(e.target.value)}
                    placeholder="VD: Forecast Q2/2026"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Mô tả</label>
                  <textarea
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Mô tả ngắn về bộ đề..."
                    rows={2}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Độ khó</label>
                  <select
                    value={formDiff}
                    onChange={e => setFormDiff(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                    }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6, display: 'block' }}>Thời gian (phút)</label>
                  <input
                    type="number"
                    value={formMinutes}
                    onChange={e => setFormMinutes(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 14, outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Question Selector */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#1A1D2B' }}>
                    Chọn câu hỏi ({totalSelected} đã chọn)
                  </h3>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3].map(p => (
                      <button
                        key={p}
                        onClick={() => setBankFilter(p as 1 | 2 | 3)}
                        style={{
                          padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 700,
                          background: bankFilter === p ? '#4361EE' : '#F1F5F9',
                          color: bankFilter === p ? '#fff' : '#64748B'
                        }}
                      >
                        Part {p} ({selectedQuestions[`part${p}` as keyof typeof selectedQuestions].length})
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    value={bankSearch}
                    onChange={e => setBankSearch(e.target.value)}
                    placeholder="Tìm câu hỏi..."
                    style={{
                      width: '100%', padding: '8px 14px 8px 34px', borderRadius: 10,
                      border: '1px solid #E2E8F0', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 12, padding: 8 }}>
                  {filteredBank.map(q => {
                    const key = `part${q.part}` as keyof typeof selectedQuestions;
                    const isSelected = selectedQuestions[key].includes(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => toggleQuestion(q.id, q.part)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                          padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: isSelected ? '#EEF2FF' : 'transparent',
                          textAlign: 'left', fontSize: 13, color: '#1A1D2B',
                          marginBottom: 2, transition: 'background 0.15s'
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: 6,
                          border: isSelected ? 'none' : '2px solid #CBD5E1',
                          background: isSelected ? '#4361EE' : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isSelected && <Check size={12} color="#fff" />}
                        </div>
                        <span style={{ flex: 1 }}>
                          {q.question_text}
                        </span>
                        {q.topic && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#94A3B8',
                            background: '#F1F5F9', padding: '2px 8px', borderRadius: 6
                          }}>
                            {q.topic}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={resetForm} className="btn btn-secondary">Hủy</button>
                <button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()} className="btn btn-primary">
                  {editingId ? 'Cập nhật' : 'Tạo bộ đề'}
                </button>
              </div>
            </div>
          )}

          {/* Sets List */}
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)
            ) : examSets.map(es => {
              const diff = DIFF_COLORS[es.difficulty] || DIFF_COLORS.medium;
              const isExpanded = expandedId === es.id;
              return (
                <div key={es.id} className="card shadow-premium" style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : es.id)}
                    style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: diff.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} color={diff.text} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, color: '#1A1D2B' }}>{es.name}</span>
                          {es.tag && <span className="badge badge--primary" style={{ fontSize: 9 }}>{es.tag}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#94A3B8' }}>{es.description}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); startEdit(es); }} className="btn-action"><Pencil size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(es.id); }} className="btn-action" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                      {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                      {/* Questions preview */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {[1, 2, 3].map(p => (
                          <div key={p}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#4361EE', marginBottom: 4 }}>PART {p}</div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {es.questions_preview[`part${p}` as keyof typeof es.questions_preview].map((q, i) => (
                                <div key={q.id} style={{ marginBottom: 2 }}>{i + 1}. {q.text}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          {/* Question Bank UI - Redesigned based on Image 2 */}
          {showQuestionForm && (
            <div className="animate-slide-down" style={{
              background: '#fff', borderRadius: 24, padding: 32, border: '2px solid #10B981',
              boxShadow: '0 12px 40px rgba(16, 185, 129, 0.15)',
              maxWidth: 1000, margin: '0 auto'
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A1D2B', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                {editingQuestionId ? '✏️ Chỉnh sửa câu hỏi' : '➕ Thêm câu hỏi mới'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40 }}>
                {/* Left: Pasting Area */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                      Nội dung câu hỏi
                    </label>
                    {!editingQuestionId && (
                      <span style={{ fontSize: 11, color: '#10B981', background: '#F0FDF4', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                        Hỗ trợ Paste nhiều câu (1 câu/dòng)
                      </span>
                    )}
                  </div>
                  <textarea
                    value={qFormText}
                    onChange={e => setQFormText(e.target.value)}
                    placeholder={editingQuestionId ? "Nhập nội dung câu hỏi..." : "Đây là nơi nhập/paste các câu hỏi vào nhé\nVí dụ:\nCâu hỏi 1\nCâu hỏi 2\nCâu hỏi 3"}
                    style={{
                      width: '100%', height: 300, padding: 20, borderRadius: 16, border: '1px solid #E2E8F0',
                      fontSize: 15, outline: 'none', resize: 'none', color: '#1A1D2B', lineHeight: '1.6',
                      background: '#F8FAFC', transition: 'border-color 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10B981'}
                    onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                  />
                </div>

                {/* Right: Settings & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 30 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, display: 'block' }}>Part</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={qFormPart}
                        onChange={e => setQFormPart(Number(e.target.value))}
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0',
                          fontSize: 14, outline: 'none', appearance: 'none', background: '#fff', cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <option value={1}>Part 1 (Introduction)</option>
                        <option value={2}>Part 2 (Cue Card)</option>
                        <option value={3}>Part 3 (Discussion)</option>
                      </select>
                      <ChevronDown size={16} color="#94A3B8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 8, display: 'block' }}>CHỦ ĐỀ (Topic)</label>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={qFormTopicId}
                        onChange={e => setQFormTopicId(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0',
                          fontSize: 14, outline: 'none', appearance: 'none', background: '#fff', cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <option value="">-- Không có chủ đề --</option>
                        {topics.filter(t => t.part === qFormPart).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} color="#94A3B8" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setShowQuestionForm(false)}
                      style={{
                        flex: 1, padding: '14px', borderRadius: 14, border: '1px solid #E2E8F0',
                        background: '#fff', color: '#64748B', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleSaveQuestion}
                      style={{
                        flex: 1.5, padding: '14px', borderRadius: 14, border: 'none',
                        background: '#10B981', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
                    >
                      {editingQuestionId ? 'Cập nhật' : 'Lưu câu hỏi'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card shadow-premium" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 12, alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', gap: 8, background: '#fff', padding: 4, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    onClick={() => setBankFilter(p as 1 | 2 | 3)}
                    style={{
                      padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                      background: bankFilter === p ? '#10B981' : 'transparent',
                      color: bankFilter === p ? '#fff' : '#64748B',
                      transition: 'all 0.2s'
                    }}
                  >Part {p}</button>
                ))}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  className="input"
                  placeholder="Tìm nội dung câu hỏi trong ngân hàng đề thi"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  style={{ paddingLeft: 42, fontSize: 14, height: 44, width: '35%', borderRadius: 12, border: '1px solid #E2E8F0' }}
                />
              </div>
            </div>
            <table className="data-table">
              <thead style={{ background: '#fff' }}>
                <tr>
                  <th style={{ paddingLeft: 24, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nội dung câu hỏi</th>
                  <th style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chủ đề</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {questionBank.filter(q => q.part === bankFilter && q.question_text.toLowerCase().includes(bankSearch.toLowerCase())).map((q, idx) => (
                  <tr key={q.id} className="hover-row">
                    <td style={{ padding: '16px 24px', maxWidth: 600 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ color: '#CBD5E1', fontWeight: 600, fontSize: 12 }}>{(idx + 1).toString().padStart(2, '0')}</span>
                        <span style={{ fontWeight: 500, color: '#1A1D2B', lineHeight: '1.5' }}>{q.question_text}</span>
                      </div>
                    </td>
                    <td>
                      {q.topic ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#4361EE', background: '#EEF2FF', padding: '4px 10px', borderRadius: 8 }}>
                          {q.topic}
                        </span>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontSize: 11 }}>Chưa phân loại</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setEditingQuestionId(q.id);
                            setQFormText(q.question_text);
                            setQFormPart(q.part);
                            // Auto-select topic if possible
                            const topicObj = topics.find(t => t.name === q.topic);
                            setQFormTopicId(topicObj?.id || '');
                            setShowQuestionForm(true);
                          }}
                          style={{ padding: 8, borderRadius: 10, border: 'none', background: '#F1F5F9', color: '#4361EE', cursor: 'pointer' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          style={{ padding: 8, borderRadius: 10, border: 'none', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
