# 文件风险分级

🔴 **高危**（改前 git stash，改后全流程验证）：
- `src/App.tsx` — 全局状态中枢
- `src/hooks/useRecordingFlow.ts` — 录制状态机
- `src/hooks/useSlides.ts` — 幻灯片数据层

🟡 **中等**（改后验证对应功能）：
- `src/components/canvas/ExcalidrawCanvas.tsx`
- `src/components/recording/DraggableRecordingControls.tsx`
- `src/components/canvas/CameraBubble.tsx`

🟢 **低风险**（改后视觉检查即可）：
- `src/index.css`、`src/services/i18n/*`、纯展示组件
