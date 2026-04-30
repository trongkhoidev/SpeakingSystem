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
  const [examSets, setExamSets] = useState<ExamSetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formDiff, setFormDiff] = useState('medium');
  const [formTag, setFormTag] = useState('');
  const [formMinutes, setFormMinutes] = useState(14);
  const [formActive, setFormActive] = useState(true);

  // Question bank
  const [questionBank, setQuestionBank] = useState<BankQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<{ part1: string[]; part2: string[]; part3: string[] }>({
    part1: [], part2: [], part3: []
  });
  const [bankFilter, setBankFilter] = useState<1 | 2 | 3>(1);
  const [bankSearch, setBankSearch] = useState('');

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

  useEffect(() => {
    fetchExamSets();
    fetchQuestionBank();
  }, [fetchExamSets, fetchQuestionBank]);

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
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1D2B', fontFamily: 'Outfit, sans-serif' }}>
            Quản lý Bộ đề thi 📝
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Tạo và quản lý bộ đề cho chế độ Forecast (Trúng tủ) và Smart Random.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12,
            background: '#4361EE', color: '#fff',
            fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(67, 97, 238, 0.3)'
          }}
        >
          <Plus size={16} /> Tạo bộ đề mới
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div style={{
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
              {filteredBank.length === 0 && (
                <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: 20 }}>
                  Không tìm thấy câu hỏi.
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={resetForm}
              style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid #E2E8F0',
                background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
              style={{
                padding: '10px 24px', borderRadius: 10, border: 'none',
                background: '#4361EE', color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(67, 97, 238, 0.3)'
              }}
            >
              {editingId ? 'Cập nhật' : 'Tạo bộ đề'}
            </button>
          </div>
        </div>
      )}

      {/* Exam Sets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, background: '#F8FAFC', borderRadius: 16, animation: 'pulse 2s infinite' }} />
          ))
        ) : examSets.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center', background: '#F8FAFC',
            borderRadius: 16, border: '2px dashed #E2E8F0'
          }}>
            <FileText size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8' }}>Chưa có bộ đề nào</p>
          </div>
        ) : (
          examSets.map(es => {
            const diff = DIFF_COLORS[es.difficulty] || DIFF_COLORS.medium;
            const isExpanded = expandedId === es.id;
            const totalQ = es.question_counts.part1 + es.question_counts.part2 + es.question_counts.part3;

            return (
              <div
                key={es.id}
                style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #E8ECF1',
                  overflow: 'hidden', transition: 'box-shadow 0.2s',
                  boxShadow: isExpanded ? '0 8px 30px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Header Row */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer'
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : es.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: diff.bg, display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      <FileText size={18} color={diff.text} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#1A1D2B' }}>{es.name}</span>
                        {es.tag && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: '#fff', background: '#4361EE',
                            padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em'
                          }}>
                            {es.tag}
                          </span>
                        )}
                        {!es.is_active && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: '#DC2626', background: '#FEF2F2',
                            padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase'
                          }}>
                            Ẩn
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{es.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['part1', 'part2', 'part3'] as const).map(pk => (
                        <span key={pk} style={{
                          fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                          background: '#F1F5F9', color: es.question_counts[pk] > 0 ? '#1A1D2B' : '#DC2626'
                        }}>
                          P{pk.slice(4)}: {es.question_counts[pk]}
                        </span>
                      ))}
                    </div>

                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                      background: diff.bg, color: diff.text
                    }}>
                      {diff.label}
                    </span>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={e => { e.stopPropagation(); handleToggleActive(es); }}
                        style={{
                          padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#F8FAFC', color: es.is_active ? '#059669' : '#94A3B8'
                        }}
                        title={es.is_active ? 'Ẩn bộ đề' : 'Hiển thị bộ đề'}
                      >
                        {es.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); startEdit(es); }}
                        style={{
                          padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#F8FAFC', color: '#4361EE'
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(es.id); }}
                        style={{
                          padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: '#FEF2F2', color: '#DC2626'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {isExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 20px' }}>
                    {(['part1', 'part2', 'part3'] as const).map(pk => (
                      <div key={pk} style={{ marginBottom: 16 }}>
                        <h4 style={{
                          fontSize: 12, fontWeight: 800, color: '#4361EE',
                          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8
                        }}>
                          Part {pk.slice(4)} ({es.questions_preview[pk].length} câu)
                        </h4>
                        {es.questions_preview[pk].length > 0 ? (
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {es.questions_preview[pk].map((q, i) => (
                              <li key={q.id} style={{
                                padding: '6px 12px', fontSize: 13, color: '#374151',
                                background: i % 2 === 0 ? '#F8FAFC' : '#fff',
                                borderRadius: 6, marginBottom: 2
                              }}>
                                {i + 1}. {q.text}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, padding: '6px 12px' }}>
                            ⚠️ Chưa có câu hỏi nào cho Part này
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, paddingBottom: 20 }}>
        Tổng: {examSets.length} bộ đề • {examSets.filter(e => e.is_active).length} đang hoạt động
      </div>
    </div>
  );
}
