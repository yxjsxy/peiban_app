from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(20), unique=True, nullable=True)  # 手机号登录
    wechat_openid = db.Column(db.String(100), unique=True, nullable=True)  # 微信OpenID
    nickname = db.Column(db.String(50))  # 昵称
    gender = db.Column(db.String(10))  # 性别：male, female, other
    signature = db.Column(db.String(200))  # 个性签名
    avatar = db.Column(db.String(200))  # 头像路径
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关联关系
    checkins = db.relationship('Checkin', backref='user', lazy=True, cascade='all, delete-orphan')
    logs = db.relationship('Log', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'phone': self.phone,
            'nickname': self.nickname,
            'gender': self.gender,
            'signature': self.signature,
            'avatar': self.avatar,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Checkin(db.Model):
    """打卡记录"""
    __tablename__ = 'checkins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    checkin_date = db.Column(db.Date, nullable=False)  # 打卡日期
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 确保每个用户每天只能打卡一次
    __table_args__ = (db.UniqueConstraint('user_id', 'checkin_date', name='unique_user_date'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'checkin_date': self.checkin_date.isoformat() if self.checkin_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

class Log(db.Model):
    """日志记录"""
    __tablename__ = 'logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text)  # 配字内容（500字以内）
    images = db.Column(db.Text)  # JSON格式存储图片路径列表
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_images(self, image_list):
        """设置图片列表"""
        self.images = json.dumps(image_list, ensure_ascii=False)
    
    def get_images(self):
        """获取图片列表"""
        if self.images:
            return json.loads(self.images)
        return []
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'images': self.get_images(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

