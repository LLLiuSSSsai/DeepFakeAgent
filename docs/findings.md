# DeepFakeAgent 后端设计 — 研究发现

## 1. 前端数据模型梳理

### 核心类型（来自 `src/utils/types.ts`）

- **DetectionMode**: `'quick' | 'deep' | 'forensic'` — 三种检测模式
- **ConclusionType**: `'real' | 'suspicious' | 'ai-generated' | 'unknown'` — 四种结论
- **HeatmapType**: `'fusion' | 'frequency' | 'noise' | 'semantic'` — 四种热力图
- **UploadedImage**: 图像文件元数据（id, file, previewUrl, name, size, width, height, status）
- **DetectionStep**: 检测步骤状态（agentName, label, description, status, duration, score, previewUrl）
- **AnomalyEvidence**: 异常证据（rank, title, description, score, heatmapType, region 坐标）
- **AgentResult**: 单个Agent结果（agentName, label, score, heatmapUrl, anomalyRegions）
- **DetectionResult**: 完整检测结果（riskScore, confidence, conclusion, agentResults[], anomalies[], fusionHeatmapUrl, reportMarkdown, unknownWarning）
- **ReportData**: 报告数据（detectionTime, imageName, detectionMode, detectionPurpose, detectorName）

### 前端状态管理（Zustand）

- **uploadStore**: images[], detectionMode, detectionPurpose → 纯客户端，上传后需调API
- **detectionStore**: phase, steps[], currentStepIndex, overallProgress, result, activeHeatmap → 需与后端状态同步

### 检测流水线（5个步骤）
1. Frequency Domain Analysis（频域分析）
2. Noise Consistency Check（噪声一致性）
3. Semantic Structure Verification（语义结构）
4. Deep Feature Analysis（深度特征）
5. Open-Set Discrimination（开放集判别）

## 2. 技术选型决策

| 维度 | 选型 | 依据 |
|------|------|------|
| 语言 | Python 3.11+ | PyTorch/OpenCV/scipy生态，与AI检测引擎天然契合 |
| Web框架 | FastAPI | 异步支持好、WebSocket原生支持、自动OpenAPI文档 |
| 数据库 | PostgreSQL 15 | JSONB灵活存储、复杂查询能力强、成熟稳定 |
| ORM | SQLAlchemy 2.0 + asyncpg | 异步支持、类型安全、Python生态标准 |
| 任务队列 | Celery + Redis | 成熟稳定、支持异步任务调度与进度追踪 |
| 文件存储 | 本地存储 + MinIO（可选） | 开发阶段本地存储，生产可切换对象存储 |
| WebSocket | FastAPI 内置 | 零额外依赖，实时推送检测步骤进度 |
| 报告生成 | WeasyPrint + python-docx | HTML→PDF转换、Word文档生成 |
| 图像处理 | Pillow + OpenCV | 图像预处理、缩放、格式转换 |
| 频域分析 | scipy + numpy | FFT/IFFT、频域特征提取 |
| ML推理 | PyTorch + ONNX Runtime | 模型加载、GPU推理加速 |

## 3. 关键架构决策

### 3.1 检测流程特点
- 是有状态的、长时间运行的任务（单张深度检测 ≤10s）
- 需要实时推送步骤进度（当前前端用 setTimeout 模拟）
- 每个步骤有独立的信号预览图（热力图/标记图）
- 支持批量检测（最多100张/次）

### 3.2 前后端交互模式
- 当前前端是一次性提交后本地模拟进度，实际上后端需支持：
  - 提交检测任务 → 返回 taskId
  - 轮询或 WebSocket 获取实时进度
  - 查询完整结果

### 3.3 检测模式差异

| 维度 | quick | deep | forensic |
|------|-------|------|----------|
| Agent 数量 | 1（DeepFeature） | 5（全部） | 5 + 证据聚合 |
| 预期耗时 | ≤3s | ≤10s | ≤20s |
| 输出内容 | 分数 + 风险等级 | 全套 + 热力图 + Top3异常 | 全套 + 结构化报告 |
| 热力图 | 无 | 4种 | 4种 + 证据标注 |

### 3.4 前端适配要点

切换为真实后端时，前端需要修改以下部分：
1. **detectionStore.startDetection()**：改为 POST /api/v1/detections → 获取 detection_id
2. **进度模拟**：移除 setTimeout 模拟，改为 WebSocket 连接 ws://host/api/v1/ws/detections/{id}
3. **结果获取**：改为 GET /api/v1/detections/{id} 获取完整 DetectionResult
4. **导出功能**：调真实导出端点（PDF/JSON/ZIP）
5. **文件上传**：uploadStore 需调 POST /api/v1/images/upload 而非纯客户端持有 File 对象

### 3.5 开放性决策（待后续确认）

| 决策 | 当前方案 | 备选 |
|------|---------|------|
| 用户系统 | 暂不引入，先无状态 | 后续加 JWT 认证 |
| 热力图生成时机 | 每步骤完成后立即生成 | 全部完成后批量生成 |
| 模型版本管理 | 配置文件指定路径 | 模型注册中心 |
| 批量报告 | 暂不支持 | 后续加批量合并导出 |

### 3.6 MVP 简化决策

| 决策 | 设计文档方案 | MVP 方案 | 理由 |
|------|-------------|---------|------|
| 数据库 | PostgreSQL | **SQLite** | 免安装配置，SQLAlchemy 切换零成本 |
| 任务队列 | Celery + Redis | **asyncio.create_task** | 免 Redis 依赖，检测 10s 内可同步 |
| WebSocket | Redis Pub/Sub | **FastAPI 直推** | 单进程够用，免中间件 |
| 文件存储 | MinIO/S3 | **本地 storage/ 目录** | 开发阶段本地最简 |
| Agent | 真实算法 | **Mock 数据** | 先打通全链路，再逐个实现 |
| 批量检测 | 完整支持 | **MVP 暂缓** | 单张检测先跑通 |
