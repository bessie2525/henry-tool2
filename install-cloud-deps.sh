#!/bin/bash
echo "========================================"
echo "  学伴精灵 - 云函数依赖批量安装"
echo "========================================"
echo ""

# 云函数列表
FUNCTIONS=("auth" "pet" "task" "shop" "chat" "review" "coin" "stats" "achievement")

# 检查 Node.js 和 npm 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm，请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 保存项目根目录
PROJECT_ROOT=$(pwd)

# 遍历安装每个云函数的依赖
SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_FUNCTIONS=()

for func in "${FUNCTIONS[@]}"
do
    echo "----------------------------------------"
    echo "正在安装 [$func] 的依赖..."
    echo ""
    
    # 检查云函数目录是否存在
    if [ ! -d "cloud/functions/$func" ]; then
        echo "⚠️  警告：云函数目录不存在: cloud/functions/$func"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_FUNCTIONS+=("$func")
        continue
    fi
    
    # 进入云函数目录
    cd "cloud/functions/$func" || {
        echo "❌ 错误：无法进入目录: cloud/functions/$func"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_FUNCTIONS+=("$func")
        cd "$PROJECT_ROOT"
        continue
    }
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        echo "⚠️  警告：未找到 package.json 文件"
        cd "$PROJECT_ROOT"
        continue
    fi
    
    # 执行 npm install
    npm install
    
    # 检查执行结果
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ [$func] 依赖安装成功！"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo ""
        echo "❌ [$func] 依赖安装失败！"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        FAILED_FUNCTIONS+=("$func")
    fi
    
    # 返回项目根目录
    cd "$PROJECT_ROOT"
    echo ""
done

echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "✅ 成功: $SUCCESS_COUNT"
echo "❌ 失败: $FAIL_COUNT"

if [ ${#FAILED_FUNCTIONS[@]} -gt 0 ]; then
    echo ""
    echo "失败的云函数："
    for func in "${FAILED_FUNCTIONS[@]}"
    do
        echo "  - $func"
    done
fi

echo ""
echo "========================================"
echo "  下一步操作"
echo "========================================"
echo "1. 在微信开发者工具中打开项目"
echo "2. 右键点击每个云函数文件夹"
echo "3. 选择「上传并部署：云端安装依赖」或「上传并部署：不安装依赖」"
echo "4. 等待所有云函数部署完成"
echo "========================================"
