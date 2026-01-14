@echo off
chcp 65001 >nul
echo ========================================
echo 陪伴App - 启动后端并测试
echo ========================================
echo.

echo 步骤1: 启动后端服务器...
echo 注意: 后端将在新窗口中运行
echo.
start "Flask后端服务器" cmd /k "python app.py"

echo 等待后端启动（5秒）...
timeout /t 5 /nobreak >nul
echo.

echo 步骤2: 运行API测试...
echo.
powershell -ExecutionPolicy Bypass -File "测试后端API.ps1"

pause

