import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { logAPI, getImageUrl } from '../api/api'
import dayjs from 'dayjs'
import './LogPage.css'

function LogPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const remaining = 9 - images.length
    
    if (files.length > remaining) {
      alert(`最多只能上传9张图片，还可以上传${remaining}张`)
      return
    }

    const newFiles = files.slice(0, remaining)
    setImageFiles(prev => [...prev, ...newFiles])
    
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImages(prev => [...prev, e.target.result])
      }
      reader.readAsDataURL(file)
    })
    
    e.target.value = ''
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请至少上传图片或输入配字')
      return
    }

    if (content.length > 500) {
      alert('配字不能超过500字')
      return
    }

    setLoading(true)
    try {
      await logAPI.createLog(content, imageFiles)
      alert('发布成功')
      navigate('/')
    } catch (error) {
      alert(error.response?.data?.error || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="log-page">
      <div className="log-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2>写日志</h2>
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </div>

      <div className="log-content">
        <div className="text-section">
          <textarea
            placeholder="记录今天的美好时光...（最多500字）"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={6}
            className="content-textarea"
          />
          <div className="char-count">
            {content.length}/500
          </div>
        </div>

        <div className="image-section">
          <div className="image-grid">
            {images.map((img, index) => (
              <div key={index} className="image-item">
                <img src={img} alt={`预览${index + 1}`} />
                <button
                  className="remove-btn"
                  onClick={() => removeImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <div
                className="image-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-icon">+</span>
                <span className="upload-text">添加图片</span>
                <span className="upload-hint">({images.length}/9)</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}

export default LogPage

