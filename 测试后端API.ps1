# 后端API测试脚本
Write-Host "=== 陪伴App 后端API测试 ===" -ForegroundColor Cyan
Write-Host ""

# 检查后端是否运行
Write-Host "1. 检查后端服务器状态..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri http://localhost:5000/api/health -Method GET -ErrorAction Stop
    $healthData = $healthCheck.Content | ConvertFrom-Json
    Write-Host "   ✓ 后端服务器正在运行" -ForegroundColor Green
    Write-Host "   状态: $($healthData.status)" -ForegroundColor Green
    Write-Host "   消息: $($healthData.message)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ 后端服务器未运行或无法连接" -ForegroundColor Red
    Write-Host "   请先运行: python app.py" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""

# 测试发送验证码
Write-Host "2. 测试发送验证码..." -ForegroundColor Yellow
try {
    $body = @{
        phone = "13800138000"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/send-code -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✓ 验证码发送成功" -ForegroundColor Green
    Write-Host "   消息: $($data.message)" -ForegroundColor Green
    if ($data.code) {
        Write-Host "   开发环境验证码: $($data.code)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ✗ 发送验证码失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# 测试手机号登录
Write-Host "3. 测试手机号登录..." -ForegroundColor Yellow
try {
    $body = @{
        phone = "13800138000"
        code = "123456"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/verify-phone -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.token) {
        Write-Host "   ✓ 登录成功" -ForegroundColor Green
        Write-Host "   用户ID: $($data.user.id)" -ForegroundColor Green
        Write-Host "   昵称: $($data.user.nickname)" -ForegroundColor Green
        Write-Host "   手机号: $($data.user.phone)" -ForegroundColor Green
        
        # 保存token供后续使用
        $script:token = $data.token
        $script:userId = $data.user.id
        
        Write-Host "   Token已保存（前20字符）: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "   ✗ 登录失败：未返回token" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ 登录失败" -ForegroundColor Red
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errorResponse) {
        Write-Host "   错误: $($errorResponse.error)" -ForegroundColor Red
    } else {
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 测试获取用户信息
if ($script:token) {
    Write-Host "4. 测试获取用户信息..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/auth/me -Method GET -Headers $headers -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 获取用户信息成功" -ForegroundColor Green
        Write-Host "   用户ID: $($data.id)" -ForegroundColor Green
        Write-Host "   昵称: $($data.nickname)" -ForegroundColor Green
        Write-Host "   手机号: $($data.phone)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ 获取用户信息失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # 测试打卡
    Write-Host "5. 测试打卡功能..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/checkin -Method POST -Headers $headers -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 打卡成功" -ForegroundColor Green
        Write-Host "   打卡日期: $($data.checkin_date)" -ForegroundColor Green
        Write-Host "   打卡时间: $($data.created_at)" -ForegroundColor Green
    } catch {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorResponse -and $errorResponse.error -like "*已经打卡*") {
            Write-Host "   ⚠ 今天已经打卡过了" -ForegroundColor Yellow
        } else {
            Write-Host "   ✗ 打卡失败" -ForegroundColor Red
            Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 测试获取打卡状态
    Write-Host "6. 测试获取打卡状态..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/checkin/status -Method GET -Headers $headers -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 获取打卡状态成功" -ForegroundColor Green
        Write-Host "   今天日期: $($data.date)" -ForegroundColor Green
        Write-Host "   已打卡: $($data.checked_in)" -ForegroundColor $(if ($data.checked_in) { "Green" } else { "Yellow" })
    } catch {
        Write-Host "   ✗ 获取打卡状态失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # 测试获取打卡日历
    Write-Host "7. 测试获取打卡日历..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/checkin/calendar -Method GET -Headers $headers -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 获取打卡日历成功" -ForegroundColor Green
        Write-Host "   打卡记录数: $($data.checkin_dates.Count)" -ForegroundColor Green
        if ($data.checkin_dates.Count -gt 0) {
            Write-Host "   最近的打卡日期:" -ForegroundColor Cyan
            $data.checkin_dates | Select-Object -First 5 | ForEach-Object {
                Write-Host "     - $_" -ForegroundColor Cyan
            }
        }
    } catch {
        Write-Host "   ✗ 获取打卡日历失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # 测试获取日志列表
    Write-Host "8. 测试获取日志列表..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
        }
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/logs -Method GET -Headers $headers -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 获取日志列表成功" -ForegroundColor Green
        Write-Host "   日志总数: $($data.total)" -ForegroundColor Green
        Write-Host "   当前页: $($data.page)" -ForegroundColor Green
        Write-Host "   每页数量: $($data.per_page)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ 获取日志列表失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    
    # 测试更新用户资料
    Write-Host "9. 测试更新用户资料..." -ForegroundColor Yellow
    try {
        $headers = @{
            Authorization = "Bearer $script:token"
            "Content-Type" = "application/json"
        }
        
        $body = @{
            nickname = "测试用户" + (Get-Random -Minimum 1000 -Maximum 9999)
            gender = "male"
            signature = "这是通过API测试更新的个性签名"
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri http://localhost:5000/api/user/profile -Method PUT -Headers $headers -Body $body -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ 更新用户资料成功" -ForegroundColor Green
        Write-Host "   新昵称: $($data.nickname)" -ForegroundColor Green
        Write-Host "   性别: $($data.gender)" -ForegroundColor Green
        Write-Host "   个性签名: $($data.signature)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ 更新用户资料失败" -ForegroundColor Red
        Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "4-9. 跳过需要登录的测试（登录失败）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "测试总结:" -ForegroundColor Yellow
Write-Host "- 如果所有测试都显示 ✓，说明后端API工作正常" -ForegroundColor Green
Write-Host "- 如果有 ✗ 标记，请检查错误信息" -ForegroundColor Red
Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

