@echo off
chcp 65001 >nul
echo ========================================
echo   学伴精灵 - 云函数依赖批量安装
echo ========================================
echo.

REM 云函数列表
set FUNCTIONS=auth pet task shop chat review coin stats achievement

REM 检查 Node.js 和 npm 是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm，请先安装 npm
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo [OK] Node.js 版本: %NODE_VERSION%
echo [OK] npm 版本: %NPM_VERSION%
echo.

REM 保存项目根目录
set PROJECT_ROOT=%cd%

REM 遍历安装每个云函数的依赖
set SUCCESS_COUNT=0
set FAIL_COUNT=0

for %%f in (%FUNCTIONS%) do (
    echo ----------------------------------------
    echo 正在安装 [%%f] 的依赖...
    echo.
    
    REM 检查云函数目录是否存在
    if not exist "cloud\functions\%%f" (
        echo [警告] 云函数目录不存在: cloud\functions\%%f
        set /a FAIL_COUNT+=1
        goto :next_func
    )
    
    REM 进入云函数目录
    cd "cloud\functions\%%f"
    if %errorlevel% neq 0 (
        echo [错误] 无法进入目录: cloud\functions\%%f
        set /a FAIL_COUNT+=1
        cd "%PROJECT_ROOT%"
        goto :next_func
    )
    
    REM 检查 package.json 是否存在
    if not exist "package.json" (
        echo [警告] 未找到 package.json 文件
        cd "%PROJECT_ROOT%"
        goto :next_func
    )
    
    REM 执行 npm install
    call npm install
    
    REM 检查执行结果
    if %errorlevel% equ 0 (
        echo.
        echo [OK] [%%f] 依赖安装成功！
        set /a SUCCESS_COUNT+=1
    ) else (
        echo.
        echo [错误] [%%f] 依赖安装失败！
        set /a FAIL_COUNT+=1
    )
    
    REM 返回项目根目录
    cd "%PROJECT_ROOT%"
    echo.
    
:next_func
)

echo ========================================
echo   安装完成！
echo ========================================
echo.
echo [OK] 成功: %SUCCESS_COUNT%
echo [错误] 失败: %FAIL_COUNT%
echo.
echo ========================================
echo   下一步操作
echo ========================================
echo 1. 在微信开发者工具中打开项目
echo 2. 右键点击每个云函数文件夹
echo 3. 选择「上传并部署：云端安装依赖」或「上传并部署：不安装依赖」
echo 4. 等待所有云函数部署完成
echo ========================================
echo.
pause
