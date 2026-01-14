import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/api'
import './LoginPage.css'

function LoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.sendCode(phone)
      setStep('code')
      // 开发环境：自动填充验证码
      if (response.data.code) {
        setCode(response.data.code)
      }
    } catch (err) {
      setError(err.response?.data?.error || '发送验证码失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!code) {
      setError('请输入验证码')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const response = await authAPI.verifyPhone(phone, code)
      login(response.data.token, response.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '验证码错误')
    } finally {
      setLoading(false)
    }
  }

  const handleWechatLogin = async () => {
    setLoading(true)
    setError('')
    try {
      // 开发环境：使用模拟code
      const response = await authAPI.wechatLogin('dev_code_123')
      login(response.data.token, response.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '微信登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>陪伴App</h1>
          <p>记录每一天的美好时光</p>
        </div>

        {step === 'phone' ? (
          <div className="login-form">
            <div className="form-group">
              <input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                className="form-input"
              />
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="form-input"
              />
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '验证中...' : '登录'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="btn-link"
            >
              返回修改手机号
            </button>
          </div>
        )}

        <div className="login-divider">
          <span>或</span>
        </div>

        <button
          onClick={handleWechatLogin}
          disabled={loading}
          className="btn-wechat"
        >
          <span className="wechat-icon">微信</span>
          微信登录
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}

export default LoginPage

