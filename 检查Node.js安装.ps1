# Node.js安装检查脚本
Write-Host "=== Node.js 安装检查 ===" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js
Write-Host "1. 检查Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Node.js已安装: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Node.js未安装或不在PATH中" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Node.js未安装或不在PATH中" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Red
}

Write-Host ""

# 检查npm
Write-Host "2. 检查npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ npm已安装: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "   ✗ npm未安装或不在PATH中" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ npm未安装或不在PATH中" -ForegroundColor Red
    Write-Host "   错误: $_" -ForegroundColor Red
}

Write-Host ""

# 检查常见安装路径
Write-Host "3. 检查常见安装路径..." -ForegroundColor Yellow
$commonPaths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs"
)

$found = $false
foreach ($path in $commonPaths) {
    if (Test-Path $path) {
        Write-Host "   ✓ 找到路径: $path" -ForegroundColor Green
        $found = $true
        
        # 检查node.exe
        $nodeExe = Join-Path $path "node.exe"
        if (Test-Path $nodeExe) {
            Write-Host "     - node.exe存在" -ForegroundColor Green
        }
        
        # 检查npm.cmd
        $npmCmd = Join-Path $path "npm.cmd"
        if (Test-Path $npmCmd) {
            Write-Host "     - npm.cmd存在" -ForegroundColor Green
        }
    }
}

if (-not $found) {
    Write-Host "   ✗ 未找到Node.js安装路径" -ForegroundColor Red
}

Write-Host ""

# 检查PATH环境变量
Write-Host "4. 检查PATH环境变量..." -ForegroundColor Yellow
$pathEnv = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
$pathEntries = $pathEnv -split ";"

$nodeInPath = $false
foreach ($entry in $pathEntries) {
    if ($entry -like "*nodejs*" -or $entry -like "*npm*") {
        Write-Host "   ✓ PATH中包含: $entry" -ForegroundColor Green
        $nodeInPath = $true
    }
}

if (-not $nodeInPath) {
    Write-Host "   ✗ PATH中未找到Node.js相关路径" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== 解决方案 ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "如果Node.js未安装，请执行以下步骤：" -ForegroundColor Yellow
    Write-Host "1. 访问 https://nodejs.org/" -ForegroundColor White
    Write-Host "2. 下载LTS版本（推荐18.x或更高）" -ForegroundColor White
    Write-Host "3. 运行安装程序，确保勾选 'Add to PATH'" -ForegroundColor White
    Write-Host "4. 安装完成后，关闭并重新打开PowerShell" -ForegroundColor White
    Write-Host "5. 运行此脚本再次检查" -ForegroundColor White
    Write-Host ""
    Write-Host "如果已安装但仍无法识别，请尝试：" -ForegroundColor Yellow
    Write-Host "1. 重启计算机" -ForegroundColor White
    Write-Host "2. 手动添加Node.js路径到PATH环境变量" -ForegroundColor White
    Write-Host "3. 使用完整路径运行：C:\Program Files\nodejs\npm.cmd install" -ForegroundColor White
}

Write-Host ""
Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

