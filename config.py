import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///peiban_app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT配置
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # 文件上传配置
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # 验证码配置（开发环境使用固定验证码，生产环境需要接入短信服务）
    SMS_CODE = '123456'  # 开发环境固定验证码
    
    # 微信登录配置（需要配置真实的AppID和AppSecret）
    WECHAT_APPID = os.environ.get('WECHAT_APPID') or ''
    WECHAT_SECRET = os.environ.get('WECHAT_SECRET') or ''

