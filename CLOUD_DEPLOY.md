# 云函数部署指南

## 云函数列表

项目包含以下云函数：

| 云函数名称 | 功能描述 |
|-----------|---------|
| auth | 认证云函数（登录、注册、绑定） |
| pet | 宠物云函数（创建、更新、喂食等） |
| task | 任务云函数（创建任务、提交任务等） |
| shop | 商店云函数（商品列表、购买等） |
| chat | 聊天云函数（AI 聊天对话） |
| review | 审核云函数（任务审核功能） |
| coin | 金币云函数（金币流水、消费记录） |
| stats | 统计云函数（数据统计、学习报告） |
| achievement | 成就云函数（成就系统） |

---

## 部署前准备

### 1. 开通云开发
- 在微信开发者工具中打开项目
- 点击工具栏「云开发」按钮
- 按照提示开通云开发环境
- 记录云开发环境 ID

### 2. 更新环境 ID
在 `app.js` 中更新云开发环境 ID：

```javascript
wx.cloud.init({
  env: 'your-env-id' // 替换为你的云开发环境 ID
})
```

---

## 部署方式一：微信开发者工具（推荐）

### 单个云函数部署

1. 打开微信开发者工具
2. 在左侧文件目录中展开 `cloud/functions`
3. 右键点击要部署的云函数文件夹
4. 选择「上传并部署：云端安装依赖」
5. 等待部署完成

### 批量部署步骤

1. **第一步：安装所有云函数的依赖**
   
   在每个云函数目录下执行 npm install：
   ```bash
   # 在项目根目录执行
   cd cloud/functions/auth && npm install
   cd ../pet && npm install
   cd ../task && npm install
   cd ../shop && npm install
   cd ../chat && npm install
   cd ../review && npm install
   cd ../coin && npm install
   cd ../stats && npm install
   cd ../achievement && npm install
   ```

2. **第二步：在微信开发者工具中逐个部署**
   
   对每个云函数执行：
   - 右键点击云函数文件夹
   - 选择「上传并部署：云端安装依赖」或「上传并部署：不安装依赖」

---

## 部署方式二：使用命令行脚本（批量部署）

### 创建批量安装依赖脚本

在项目根目录创建 `install-cloud-deps.sh`：

```bash
#!/bin/bash
echo "开始安装所有云函数依赖..."

FUNCTIONS=("auth" "pet" "task" "shop" "chat" "review" "coin" "stats" "achievement")

for func in "${FUNCTIONS[@]}"
do
    echo "正在安装 $func 的依赖..."
    cd "cloud/functions/$func"
    npm install
    cd ../../..
done

echo "所有云函数依赖安装完成！"
```

### 执行批量安装

```bash
# 给脚本添加执行权限
chmod +x install-cloud-deps.sh

# 执行脚本
./install-cloud-deps.sh
```

---

## 部署方式三：使用微信云开发 CLI

### 1. 安装微信云开发 CLI

```bash
npm install -g @cloudbase/cli
```

### 2. 登录云开发

```bash
cloudbase login
```

### 3. 初始化项目（如果需要）

```bash
cloudbase init
```

### 4. 部署云函数

```bash
# 部署单个云函数
cloudbase functions:deploy auth

# 部署所有云函数
cloudbase functions:deploy
```

---

## 验证部署

### 1. 检查云函数列表
- 在微信开发者工具中打开「云开发控制台」
- 进入「云函数」标签页
- 确认所有云函数已成功部署

### 2. 测试云函数
可以在云开发控制台中直接测试云函数：
- 点击云函数名称
- 选择「测试」标签
- 输入测试参数
- 点击「测试」按钮

---

## 常见问题

### Q: 部署时提示依赖安装失败
A: 检查网络连接，或尝试在本地安装依赖后选择「上传并部署：不安装依赖」

### Q: 云函数调用报错
A: 检查：
1. 云开发环境 ID 是否正确
2. 云函数是否已成功部署
3. 云函数权限配置是否正确

### Q: 如何更新云函数
A: 修改云函数代码后，重新执行部署步骤即可

---

## 部署顺序建议

建议按照以下顺序部署云函数：

1. **auth** - 认证基础
2. **pet** - 宠物系统
3. **coin** - 金币系统
4. **task** - 任务系统
5. **shop** - 商店系统
6. **review** - 审核系统
7. **chat** - 聊天系统
8. **stats** - 统计系统
9. **achievement** - 成就系统
