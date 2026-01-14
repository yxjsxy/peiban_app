#!/bin/bash

echo "启动陪伴App..."
echo ""
echo "请先确保已安装Python和Node.js"
echo ""
echo "启动后端服务器..."
python3 app.py &
BACKEND_PID=$!
sleep 3
echo ""
echo "启动前端服务器..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..
echo ""
echo "应用已启动！"
echo "后端: http://localhost:5000"
echo "前端: http://localhost:3000"
echo ""
echo "按Ctrl+C停止服务"
wait

