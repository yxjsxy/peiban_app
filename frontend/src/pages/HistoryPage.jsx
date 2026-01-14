import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logAPI, getImageUrl } from '../api/api'
import dayjs from '../utils/dayjsConfig'
import './HistoryPage.css'

function HistoryPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async (pageNum = 1) => {
    try {
      const response = await logAPI.getLogs(pageNum, 20)
      if (pageNum === 1) {
        setLogs(response.data.logs)
      } else {
        setLogs(prev => [...prev, ...response.data.logs])
      }
      setHasMore(pageNum < response.data.pages)
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    loadLogs(nextPage)
  }

  if (loading && logs.length === 0) {
    return (
      <div className="history-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <button className="back-btn" onClick={() => navigate('/')}>← 返回</button>
        <h2>历史记录</h2>
      </div>

      <div className="history-content">
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>还没有记录</p>
            <button className="create-btn" onClick={() => navigate('/log')}>
              去写日志
            </button>
          </div>
        ) : (
          <>
            {logs.map(log => (
              <div
                key={log.id}
                className="history-item"
                onClick={() => navigate(`/log/${log.id}`)}
              >
                <div className="history-time">
                  {dayjs(log.created_at).format('YYYY年MM月DD日 HH:mm')}
                </div>
                {log.content && (
                  <div className="history-text">
                    {log.content.length > 50
                      ? log.content.substring(0, 50) + '...'
                      : log.content}
                  </div>
                )}
                {log.images && log.images.length > 0 && (
                  <div className="history-images">
                    {log.images.slice(0, 3).map((img, index) => (
                      <img
                        key={index}
                        src={getImageUrl(img)}
                        alt={`图片${index + 1}`}
                      />
                    ))}
                    {log.images.length > 3 && (
                      <div className="more-images">+{log.images.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {hasMore && (
              <button className="load-more-btn" onClick={loadMore}>
                {loading ? '加载中...' : '加载更多'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default HistoryPage

