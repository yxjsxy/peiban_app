import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useAuth } from '../context/AuthContext'
import { checkinAPI } from '../api/api'
import dayjs from '../utils/dayjsConfig'
import './HomePage.css'

function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkinDates, setCheckinDates] = useState([])
  const [loading, setLoading] = useState(false)
  const [today] = useState(new Date())

  useEffect(() => {
    loadCheckinData()
  }, [])

  const loadCheckinData = async () => {
    try {
      const [statusRes, calendarRes] = await Promise.all([
        checkinAPI.getStatus(),
        checkinAPI.getCalendar()
      ])
      setCheckedIn(statusRes.data.checked_in)
      setCheckinDates(calendarRes.data.checkin_dates.map(d => new Date(d)))
    } catch (error) {
      console.error('加载打卡数据失败:', error)
    }
  }

  const handleCheckin = async () => {
    if (checkedIn) return
    
    setLoading(true)
    try {
      await checkinAPI.checkin()
      setCheckedIn(true)
      await loadCheckinData()
    } catch (error) {
      alert(error.response?.data?.error || '打卡失败')
    } finally {
      setLoading(false)
    }
  }

  const tileClassName = ({ date }) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD')
    const isChecked = checkinDates.some(d => dayjs(d).format('YYYY-MM-DD') === dateStr)
    const isToday = dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
    
    if (isChecked) {
      return 'calendar-day-checked'
    }
    if (isToday) {
      return 'calendar-day-today'
    }
    return ''
  }

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout()
      navigate('/login')
    }
  }

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-top">
          <div className="user-info">
            <div className="avatar-container" onClick={() => navigate('/profile')}>
              <img 
                src={user?.avatar ? `/uploads/${user.avatar}` : '/default-avatar.png'} 
                alt="头像"
                className="avatar"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGRjlBOEUiLz4KPHN2ZyB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4QzE2IDUuNzkgMTQuMjEgNCAxMiA0QzkuNzkgNCA4IDUuNzkgOCA4QzggMTAuMjEgOS43OSAxMiAxMiAxMlMxMiAxMiAxMiAxMk0xMiAxNEM5LjMzIDE0IDQgMTUuMzMgNCAxOFYyMEgyMFYxOEMyMCAxNS4zMyAxNC42NyAxNCAxMiAxNFoiLz4KPC9zdmc+Cjwvc3ZnPg=='
                }}
              />
            </div>
            <div>
              <h2>{user?.nickname || '用户'}</h2>
              <p className="greeting">今天也要加油哦~</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="退出登录">
            <span className="logout-icon">🚪</span>
            <span className="logout-text">退出</span>
          </button>
        </div>
      </div>

      <div className="checkin-section">
        <div className="checkin-card">
          <div className="checkin-date">
            <span className="date-label">今天是</span>
            <span className="date-value">{dayjs().format('YYYY年MM月DD日')}</span>
            <span className="weekday">{['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dayjs().day()]}</span>
          </div>
          <button
            className={`checkin-btn ${checkedIn ? 'checked' : ''}`}
            onClick={handleCheckin}
            disabled={checkedIn || loading}
          >
            {checkedIn ? '✓ 已打卡' : loading ? '打卡中...' : '立即打卡'}
          </button>
        </div>
      </div>

      <div className="calendar-section">
        <h3 className="section-title">打卡日历</h3>
        <div className="calendar-wrapper">
          <Calendar
            value={today}
            tileClassName={tileClassName}
            calendarType="US"
            locale="zh-CN"
          />
        </div>
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot today"></span>
            <span>今天</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot checked"></span>
            <span>已打卡</span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button className="action-btn" onClick={() => navigate('/log')}>
          📝 写日志
        </button>
        <button className="action-btn" onClick={() => navigate('/history')}>
          📚 历史记录
        </button>
      </div>
    </div>
  )
}

export default HomePage

