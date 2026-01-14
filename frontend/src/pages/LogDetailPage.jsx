import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { logAPI, getImageUrl } from '../api/api'
import dayjs from '../utils/dayjsConfig'
import './LogDetailPage.css'

function LogDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLog()
  }, [id])

  const loadLog = async () => {
    try {
      const response = await logAPI.getLog(id)
      setLog(response.data)
    } catch (error) {
      alert('加载日志失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('确定要删除这条日志吗？')) return

    try {
      await logAPI.deleteLog(id)
      alert('删除成功')
      navigate('/')
    } catch (error) {
      alert('删除失败')
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!log) {
    return null
  }

  return (
    <div className="log-detail-page">
      <div className="log-detail-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2>日志详情</h2>
        <button className="delete-btn" onClick={handleDelete}>删除</button>
      </div>

      <div className="log-detail-content">
        <div className="log-time">
          {dayjs(log.created_at).format('YYYY年MM月DD日 HH:mm')}
        </div>

        {log.content && (
          <div className="log-text">
            {log.content}
          </div>
        )}

        {log.images && log.images.length > 0 && (
          <div className="log-images">
            {log.images.map((img, index) => (
              <div key={index} className="log-image-item">
                <img src={getImageUrl(img)} alt={`图片${index + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LogDetailPage

