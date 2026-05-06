# DeepFakeAgent 后端实现 — 任务计划

## 当前状态
- ✅ 前端原型完成（mock 数据驱动）
- ✅ 需求 + 设计文档完成
- 🔄 后端 MVP 实现

## MVP 原则
- **先壳后芯**：FastAPI + WebSocket 全通，Agent 返回 mock 数据
- **最小依赖**：SQLite 代替 PostgreSQL，asyncio 代替 Celery，免 Redis
- **快速验证**：前端能立刻对接真实 API，链路通畅后再逐个实现 Agent

---

## 阶段 1：后端骨架 + 图像管理 API
- [ ] 创建 backend/ 项目结构
- [ ] FastAPI 应用入口 + 配置管理
- [ ] SQLite + SQLAlchemy（保持与 PostgreSQL 的兼容性）
- [ ] 图像上传 / 列表 / 详情 / 删除 API
- [ ] 文件存储（本地 storage/ 目录）
- [ ] 统一响应信封 + 错误处理

## 阶段 2：检测 API + Mock 引擎
- [ ] 检测任务创建 / 状态查询 / 列表 API
- [ ] Agent 基类 + 5 个 Mock Agent
- [ ] Orchestrator 编排（串行执行 + 加权融合）
- [ ] 检测结果 mock 数据（复用前端 DETECTION_STEPS）

## 阶段 3：WebSocket 实时推送
- [ ] WebSocket 端点 /ws/detections/{id}
- [ ] 检测进度实时推送（step_started / step_completed / detection_completed）
- [ ] 连接管理器

## 阶段 4：报告导出
- [ ] Markdown 报告生成
- [ ] PDF 导出（WeasyPrint）
- [ ] JSON 导出

## 阶段 5：前端对接（后续）
- [ ] 替换 uploadStore → 真实 API 上传
- [ ] 替换 detectionStore → WebSocket + API 查询
- [ ] 替换导出按钮 → 真实导出端点
