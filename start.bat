@echo off
chcp 65001 >nul
echo 启动陪伴App...
echo.
echo 请先确保已安装Python和Node.js
echo.
echo 启动后端服务器...
start cmd /k "python app.py"
timeout /t 3 /nobreak >nul
echo.
echo 启动前端服务器...
cd frontend
start cmd /k "npm run dev"
cd ..
echo.
echo 应用已启动！
echo 后端: http://localhost:5000
echo 前端: http://localhost:3000
pause

