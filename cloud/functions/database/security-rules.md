# 数据库安全规则

## 安全规则说明

以下规则需在微信云开发控制台配置：

### users（用户表）
```json
{
  "read": "auth.openid == doc.openId",
  "write": "auth.openid == doc.openId"
}
```

### students（学生档案）
```json
{
  "read": "auth.openid == resource.data.userId",
  "write": "auth.openid == resource.data.userId"
}
```

### parents（家长档案）
```json
{
  "read": "auth.openid == resource.data.userId",
  "write": "auth.openid == resource.data.userId"
}
```

### bindings（绑定关系表）
```json
{
  "read": "auth.openid == resource.data.parentId || auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid == resource.data.parentId"
}
```

### pets（宠物表）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### pet_items（宠物物品）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### shop_items（商店商品）
```json
{
  "read": true,
  "write": false
}
```

### coin_transactions（金币交易流水）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": false
}
```

### task_chinese（语文任务记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### task_english_wordlists（英语单词列表）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### task_english_attempts（英语冒险挑战记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### task_english_wrongbook（错词地牢记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### task_english_collection（单词图鉴记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### task_daily_templates（日常打卡模板）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getParentUserIds(resource.data.studentId)"
}
```

### task_daily_checkins（日常打卡记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### achievements（成就记录）
```json
{
  "read": true,
  "write": false
}
```

### chat_messages（宠物聊天记录）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getStudentUserIds(resource.data.studentId)"
}
```

### settings（系统设置）
```json
{
  "read": "auth.openid in getStudentUserIds(resource.data.studentId)",
  "write": "auth.openid in getParentUserIds(resource.data.studentId)"
}
```

## 辅助函数说明

在实际配置中，需要使用云函数来实现权限校验，因为微信云开发的数据库安全规则不支持复杂的自定义函数。

所有写入操作应通过云函数进行，并在云函数端进行严格的权限校验。
