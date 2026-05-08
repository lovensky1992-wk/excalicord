# 录制状态机

权威定义。任何录制相关改动必须对照此图。

```
idle ──[点击录制]──→ preview ──[点击开始]──→ countdown(3s) ──→ recording
                     │                                         │    ↑
                     │[点击取消]                        [点击暂停]  [点击继续]
                     ↓                                         ↓    │
                    idle                                     paused──┘
                                                               │
                                              recording ──[点击停止]──→ exporting
```

各状态 UI 表现：
| 状态 | UI 表现 |
|------|---------|
| idle | 红色圆形录制按钮，工具栏正常 |
| preview | 预览框（绿色边框），"开始录制"+"取消"按钮 |
| countdown | 3-2-1 倒计时覆盖层 |
| recording | 红色脉冲指示灯，计时器运行，**工具栏保持可见** |
| paused | 计时器暂停，暂停图标 |
| exporting | 导出进度条 |
