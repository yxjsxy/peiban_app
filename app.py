from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from datetime import datetime, date, timedelta
import os
import json
import uuid
from PIL import Image
import requests

from config import Config
from models import db, User, Checkin, Log

app = Flask(__name__)
app.config.from_object(Config)

# 确保UTF-8编码
app.config['JSON_AS_ASCII'] = False

# 初始化扩展
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# 确保上传目录存在
os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'avatars'), exist_ok=True)
os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'logs'), exist_ok=True)

def allowed_file(filename):
    """检查文件扩展名是否允许"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def save_image(file, subfolder):
    """保存图片并返回路径"""
    if file and allowed_file(file.filename):
        # 生成唯一文件名
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, subfolder, filename)
        
        # 保存文件
        file.save(filepath)
        
        # 压缩图片（可选，减小文件大小）
        try:
            img = Image.open(filepath)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
            img.save(filepath, 'JPEG', quality=85, optimize=True)
        except Exception as e:
            print(f"图片处理错误: {e}")
        
        return f"{subfolder}/{filename}"
    return None

@app.route('/', methods=['GET'])
def index():
    """首页"""
    return jsonify({
        'message': '陪伴App API服务',
        'version': '1.0.0',
        'endpoints': {
            'health': '/api/health',
            'auth': {
                'send_code': '/api/auth/send-code',
                'verify_phone': '/api/auth/verify-phone',
                'wechat': '/api/auth/wechat',
                'me': '/api/auth/me'
            },
            'user': {
                'profile': '/api/user/profile',
                'avatar': '/api/user/avatar'
            },
            'checkin': {
                'checkin': '/api/checkin',
                'status': '/api/checkin/status',
                'calendar': '/api/checkin/calendar'
            },
            'logs': {
                'list': '/api/logs',
                'create': '/api/logs',
                'detail': '/api/logs/<id>',
                'delete': '/api/logs/<id>'
            }
        },
        'docs': '访问 /api/health 测试服务是否正常'
    })

@app.route('/api/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({'status': 'ok', 'message': '服务运行正常'})

# ==================== 用户认证 ====================

@app.route('/api/auth/send-code', methods=['POST'])
def send_code():
    """发送验证码（开发环境返回固定验证码）"""
    data = request.get_json()
    phone = data.get('phone')
    
    if not phone or len(phone) != 11:
        return jsonify({'error': '手机号格式不正确'}), 400
    
    # 开发环境：返回固定验证码
    # 生产环境：这里应该调用短信服务API
    return jsonify({
        'message': '验证码已发送',
        'code': Config.SMS_CODE  # 开发环境返回验证码，生产环境不返回
    })

@app.route('/api/auth/verify-phone', methods=['POST'])
def verify_phone():
    """手机号验证码登录"""
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    
    if not phone or not code:
        return jsonify({'error': '手机号和验证码不能为空'}), 400
    
    # 验证码校验（开发环境）
    if code != Config.SMS_CODE:
        return jsonify({'error': '验证码错误'}), 400
    
    # 查找或创建用户
    user = User.query.filter_by(phone=phone).first()
    if not user:
        user = User(phone=phone, nickname=f'用户{phone[-4:]}')
        db.session.add(user)
        db.session.commit()
    
    # 生成JWT token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    })

@app.route('/api/auth/wechat', methods=['POST'])
def wechat_login():
    """微信登录"""
    data = request.get_json()
    code = data.get('code')  # 微信授权码
    
    if not code:
        return jsonify({'error': '授权码不能为空'}), 400
    
    # 开发环境：模拟微信登录
    # 生产环境：需要调用微信API获取openid
    if not Config.WECHAT_APPID or not Config.WECHAT_SECRET:
        # 开发环境：使用code作为openid（仅用于测试）
        openid = f"dev_openid_{code}"
    else:
        # 生产环境：调用微信API
        try:
            url = f"https://api.weixin.qq.com/sns/jscode2session"
            params = {
                'appid': Config.WECHAT_APPID,
                'secret': Config.WECHAT_SECRET,
                'js_code': code,
                'grant_type': 'authorization_code'
            }
            response = requests.get(url, params=params, timeout=5)
            result = response.json()
            openid = result.get('openid')
            if not openid:
                return jsonify({'error': '微信登录失败'}), 400
        except Exception as e:
            return jsonify({'error': f'微信登录失败: {str(e)}'}), 500
    
    # 查找或创建用户
    user = User.query.filter_by(wechat_openid=openid).first()
    if not user:
        user = User(wechat_openid=openid, nickname='微信用户')
        db.session.add(user)
        db.session.commit()
    
    # 生成JWT token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    })

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """获取当前用户信息"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())

# ==================== 用户资料 ====================

@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """获取用户资料"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    return jsonify(user.to_dict())

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """更新用户资料"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    data = request.get_json()
    if 'nickname' in data:
        user.nickname = data['nickname']
    if 'gender' in data:
        user.gender = data['gender']
    if 'signature' in data:
        user.signature = data['signature']
    
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(user.to_dict())

@app.route('/api/user/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """上传头像"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    if 'avatar' not in request.files:
        return jsonify({'error': '没有上传文件'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400
    
    # 删除旧头像
    if user.avatar:
        old_path = os.path.join(Config.UPLOAD_FOLDER, user.avatar)
        if os.path.exists(old_path):
            os.remove(old_path)
    
    # 保存新头像
    avatar_path = save_image(file, 'avatars')
    if not avatar_path:
        return jsonify({'error': '文件格式不支持'}), 400
    
    user.avatar = avatar_path
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'avatar': avatar_path,
        'user': user.to_dict()
    })

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """提供上传的文件"""
    return send_from_directory(Config.UPLOAD_FOLDER, filename)

# ==================== 打卡功能 ====================

@app.route('/api/checkin', methods=['POST'])
@jwt_required()
def checkin():
    """打卡（仅限今天）"""
    user_id = int(get_jwt_identity())
    today = date.today()
    
    # 检查今天是否已打卡
    existing = Checkin.query.filter_by(user_id=user_id, checkin_date=today).first()
    if existing:
        return jsonify({'error': '今天已经打卡过了'}), 400
    
    # 创建打卡记录
    checkin = Checkin(user_id=user_id, checkin_date=today)
    db.session.add(checkin)
    db.session.commit()
    
    return jsonify(checkin.to_dict())

@app.route('/api/checkin/status', methods=['GET'])
@jwt_required()
def checkin_status():
    """获取打卡状态"""
    user_id = int(get_jwt_identity())
    today = date.today()
    
    checkin = Checkin.query.filter_by(user_id=user_id, checkin_date=today).first()
    return jsonify({
        'checked_in': checkin is not None,
        'date': today.isoformat()
    })

@app.route('/api/checkin/calendar', methods=['GET'])
@jwt_required()
def get_checkin_calendar():
    """获取打卡日历数据"""
    user_id = int(get_jwt_identity())
    
    # 获取最近3个月的打卡记录
    start_date = date.today() - timedelta(days=90)
    checkins = Checkin.query.filter(
        Checkin.user_id == user_id,
        Checkin.checkin_date >= start_date
    ).all()
    
    # 转换为日期字符串集合
    checkin_dates = {c.checkin_date.isoformat() for c in checkins}
    
    return jsonify({
        'checkin_dates': list(checkin_dates)
    })

# ==================== 日志功能 ====================

@app.route('/api/logs', methods=['GET'])
@jwt_required()
def get_logs():
    """获取日志列表"""
    user_id = int(get_jwt_identity())
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    logs = Log.query.filter_by(user_id=user_id)\
        .order_by(Log.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'page': page,
        'per_page': per_page,
        'pages': logs.pages
    })

@app.route('/api/logs', methods=['POST'])
@jwt_required()
def create_log():
    """创建日志"""
    user_id = int(get_jwt_identity())
    content = request.form.get('content', '')
    
    # 验证配字长度
    if len(content) > 500:
        return jsonify({'error': '配字不能超过500字'}), 400
    
    # 处理图片上传（最多9张）
    images = []
    file_count = 0
    for key in request.files:
        if key.startswith('image') and file_count < 9:
            file = request.files[key]
            if file.filename:
                image_path = save_image(file, 'logs')
                if image_path:
                    images.append(image_path)
                    file_count += 1
    
    if not images and not content:
        return jsonify({'error': '至少需要上传图片或配字'}), 400
    
    # 创建日志
    log = Log(user_id=user_id, content=content)
    log.set_images(images)
    db.session.add(log)
    db.session.commit()
    
    return jsonify(log.to_dict())

@app.route('/api/logs/<int:log_id>', methods=['GET'])
@jwt_required()
def get_log(log_id):
    """获取单条日志"""
    user_id = int(get_jwt_identity())
    log = Log.query.filter_by(id=log_id, user_id=user_id).first()
    if not log:
        return jsonify({'error': '日志不存在'}), 404
    return jsonify(log.to_dict())

@app.route('/api/logs/<int:log_id>', methods=['DELETE'])
@jwt_required()
def delete_log(log_id):
    """删除日志"""
    user_id = int(get_jwt_identity())
    log = Log.query.filter_by(id=log_id, user_id=user_id).first()
    if not log:
        return jsonify({'error': '日志不存在'}), 404
    
    # 删除关联的图片文件
    for image_path in log.get_images():
        full_path = os.path.join(Config.UPLOAD_FOLDER, image_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    
    db.session.delete(log)
    db.session.commit()
    
    return jsonify({'message': '删除成功'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)

