@echo off
chcp 65001 >nul
echo ========================================
echo 安装Python依赖包
echo ========================================
echo.

echo 正在安装依赖包...
python -m pip install Flask==3.0.0 Flask-CORS==4.0.0 Flask-SQLAlchemy==3.1.1 Flask-JWT-Extended==4.6.0 Werkzeug==3.0.1 Pillow==10.1.0 qrcode==7.4.2 requests==2.31.0 python-dotenv==1.0.0

echo.
echo ========================================
echo 安装完成！
echo ========================================
echo.
echo 现在可以运行: python app.py
echo.
pause

