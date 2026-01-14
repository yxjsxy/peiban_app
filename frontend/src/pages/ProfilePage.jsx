import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userAPI, getImageUrl } from '../api/api'
import './ProfilePage.css'

function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    nickname: '',
    gender: '',
    signature: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        gender: user.gender || '',
        signature: user.signature || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setUploading(true)
    try {
      await userAPI.uploadAvatar(file)
      await refreshUser()
    } catch (error) {
      alert(error.response?.data?.error || '上传头像失败')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await userAPI.updateProfile(formData)
      await refreshUser()
      alert('保存成功')
      navigate('/')
    } catch (error) {
      alert(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2>个人资料</h2>
      </div>

      <div className="profile-content">
        <div className="avatar-section">
          <div className="avatar-container" onClick={handleAvatarClick}>
            {uploading ? (
              <div className="uploading">上传中...</div>
            ) : (
              <img
                src={user?.avatar ? getImageUrl(user.avatar) : '/default-avatar.png'}
                alt="头像"
                className="avatar"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSIjRkY5QThFIi8+Cjwvc3ZnPg=='
                }}
              />
            )}
            <div className="avatar-overlay">
              <span>点击更换</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>

        <div className="form-section">
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="请输入昵称"
              maxLength={50}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>性别</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleInputChange}
                />
                <span>男</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleInputChange}
                />
                <span>女</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={handleInputChange}
                />
                <span>其他</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>个性签名</label>
            <textarea
              name="signature"
              value={formData.signature}
              onChange={handleInputChange}
              placeholder="请输入个性签名"
              maxLength={200}
              rows={4}
              className="form-textarea"
            />
          </div>

          <button
            className="save-btn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

