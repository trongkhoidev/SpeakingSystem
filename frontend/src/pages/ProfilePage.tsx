import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { User, Mail, Phone, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ProfilePage() {
  const { user } = useAuth() as any;
  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const handleSave = () => {
    // Lưu ý: Hiện tại chức năng này chỉ là mô phỏng giao diện
    // Để cập nhật lên server, cần thêm endpoint /auth/me hoặc /user/profile.
    toast.success('Đã cập nhật thông tin thành công!');
  };

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }} className="page-enter">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
          Thông tin cá nhân
        </h1>
        <p style={{ color: '#6B7280', fontSize: '15px' }}>
          Quản lý thông tin hồ sơ và các tuỳ chọn bảo mật của bạn.
        </p>
      </div>

      <div className="card" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #E5E7EB', paddingBottom: '24px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: '#EEF0FD', 
            color: '#4361EE', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '32px', fontWeight: 800 
          }}>
            {(user?.email || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>{user?.name || user?.email?.split('@')[0] || 'Người dùng'}</div>
            <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', textTransform: 'capitalize' }}>
              Vai trò: <span style={{ fontWeight: 600, color: user?.role === 'admin' ? '#4361EE' : '#1A8F5C' }}>{user?.role || 'user'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
              <User size={14} /> Tên hiển thị
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none' }}
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
              <Mail size={14} /> Email
            </label>
            <input 
              type="text" 
              value={user?.email || ''} 
              disabled
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#9CA3AF', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
              <Phone size={14} /> Số điện thoại
            </label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none' }}
              placeholder="Thêm số điện thoại"
            />
          </div>
          
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#4B5563', marginBottom: '8px' }}>
              <Shield size={14} /> Trạng thái tài khoản
            </label>
            <div style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: '#E6F9F0', color: '#1A8F5C', fontWeight: 600, fontSize: '14px', border: '1px solid #A7F3D0' }}>
              Đang hoạt động tốt
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button 
            onClick={handleSave}
            className="btn btn-primary" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', 
              borderRadius: '12px', fontSize: '14px', fontWeight: 600, 
              background: 'linear-gradient(135deg, #4361EE, #7209B7)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 20px -4px rgba(67, 97, 238, 0.4)'
            }}
          >
            <Save size={16} /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
