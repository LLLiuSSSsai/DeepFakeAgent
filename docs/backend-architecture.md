# DeepFakeAgent 后端架构实现文档

> 版本：v1.0 | 语言：Python 3.11+ | 框架：FastAPI + Celery + PostgreSQL

---

## 目录

1. [项目结构](#1-项目结构)
2. [数据库设计](#2-数据库设计)
3. [核心模块设计](#3-核心模块设计)
4. [Agent 编排引擎](#4-agent-编排引擎)
5. [异步任务系统](#5-异步任务系统)
6. [WebSocket 实时推送](#6-websocket-实时推送)
7. [文件存储与图像处理](#7-文件存储与图像处理)
8. [报告生成引擎](#8-报告生成引擎)
9. [部署架构](#9-部署架构)
10. [安全与性能考量](#10-安全与性能考量)

---

## 1. 项目结构

```
backend/
├── alembic/                      # 数据库迁移
│   ├── versions/
│   └── env.py
├── app/
│   ├── __init__.py
│   ├── main.py                   # FastAPI 应用入口
│   ├── config.py                 # 配置（环境变量、settings）
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py               # 依赖注入（DB session, celery等）
│   │   ├── router.py             # 主路由聚合
│   │   ├── images.py             # 图像管理路由
│   │   ├── detections.py         # 检测任务路由
│   │   ├── batch.py              # 批量检测路由
│   │   ├── exports.py            # 报告导出路由
│   │   └── websocket.py          # WebSocket 路由
│   ├── models/
│   │   ├── __init__.py
│   │   ├── image.py              # Image ORM 模型
│   │   ├── detection.py          # DetectionTask / DetectionStep ORM
│   │   ├── anomaly.py            # AnomalyEvidence ORM
│   │   └── batch.py              # BatchTask ORM
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── image.py              # 图像相关 Pydantic schema
│   │   ├── detection.py          # 检测相关 Pydantic schema
│   │   ├── batch.py              # 批量检测 schema
│   │   └── ws.py                 # WebSocket 消息 schema
│   ├── services/
│   │   ├── __init__.py
│   │   ├── image_service.py      # 图像管理逻辑
│   │   ├── detection_service.py  # 检测任务编排
│   │   ├── export_service.py     # 报告导出
│   │   └── file_service.py       # 文件存储
│   ├── engine/                    # 检测引擎核心
│   │   ├── __init__.py
│   │   ├── orchestrator.py       # 主控编排器（Supervisor Agent）
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # Agent 基类
│   │   │   ├── frequency.py      # 频域分析 Agent
│   │   │   ├── noise.py          # 噪声一致性 Agent
│   │   │   ├── semantic.py       # 语义结构 Agent
│   │   │   ├── deep_feature.py   # 深度特征 Agent
│   │   │   └── open_set.py       # 开放集判别 Agent
│   │   ├── models/               # 预训练模型权重存放
│   │   │   └── .gitkeep
│   │   └── utils/
│   │       ├── fft.py            # 傅里叶变换工具
│   │       ├── noise_analysis.py # 噪声特征提取
│   │       └── heatmap.py        # 热力图生成
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery_app.py         # Celery 配置
│   │   ├── detection_task.py     # 检测异步任务
│   │   └── export_task.py        # 报告生成异步任务
│   └── utils/
│       ├── __init__.py
│       ├── image_utils.py        # 图像处理工具（压缩、缩放）
│       ├── response.py           # 统一响应信封
│       └── exceptions.py         # 自定义异常
├── tests/
│   ├── conftest.py
│   ├── test_api/
│   └── test_engine/
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 2. 数据库设计

### 2.1 ER 图（文字描述）

```
images (1) ──────< (N) detection_tasks
detection_tasks (1) ─< (N) detection_steps
detection_tasks (1) ─< (N) anomaly_evidences
detection_tasks (1) ─< (N) agent_results
detection_tasks (N) >───── (1) batch_tasks
batch_tasks (1) ─< (N) batch_items
```

### 2.2 表结构

#### images

```sql
CREATE TABLE images (
    id              VARCHAR(32) PRIMARY KEY,         -- 雪花ID: img_xxxxxxxx
    original_name   VARCHAR(512) NOT NULL,
    storage_path    VARCHAR(1024) NOT NULL,           -- 存储路径
    thumbnail_path  VARCHAR(1024),
    size            BIGINT NOT NULL,                  -- 字节数
    width           INTEGER,
    height          INTEGER,
    format          VARCHAR(10) NOT NULL,             -- JPEG/PNG/WebP/...
    md5_hash        VARCHAR(32),                      -- 文件去重
    exif_data       JSONB DEFAULT '{}',               -- EXIF 元数据
    status          VARCHAR(20) DEFAULT 'pending',    -- pending/uploaded/detecting/completed/error
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_images_status ON images(status);
CREATE INDEX idx_images_created ON images(created_at DESC);
```

#### detection_tasks

```sql
CREATE TABLE detection_tasks (
    id              VARCHAR(32) PRIMARY KEY,          -- det_xxxxxxxx
    image_id        VARCHAR(32) NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    mode            VARCHAR(20) NOT NULL,             -- quick/deep/forensic
    purpose         TEXT DEFAULT '',
    status          VARCHAR(20) DEFAULT 'pending',    -- pending/queued/running/completed/error/cancelled
    overall_progress INTEGER DEFAULT 0,               -- 0-100
    risk_score      INTEGER,                          -- 0-100
    confidence      FLOAT,
    conclusion      VARCHAR(20),                      -- real/suspicious/ai-generated/unknown
    conclusion_label VARCHAR(256),
    fusion_heatmap_path VARCHAR(1024),
    report_markdown TEXT,
    total_duration  FLOAT,                            -- 秒
    unknown_warning JSONB,                            -- {reason, distance_analysis, possible_attack_type}
    error_message   TEXT,
    worker_id       VARCHAR(64),                      -- Celery worker ID
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_detections_image ON detection_tasks(image_id);
CREATE INDEX idx_detections_status ON detection_tasks(status);
CREATE INDEX idx_detections_created ON detection_tasks(created_at DESC);
```

#### detection_steps

```sql
CREATE TABLE detection_steps (
    id              VARCHAR(32) PRIMARY KEY,          -- step_xxxxxxxx
    task_id         VARCHAR(32) NOT NULL REFERENCES detection_tasks(id) ON DELETE CASCADE,
    step_type       VARCHAR(30) NOT NULL,             -- frequency/noise/semantic/deepfeature/openset
    agent_name      VARCHAR(64) NOT NULL,
    label           VARCHAR(128) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending',    -- pending/running/completed/error/skipped
    score           FLOAT,
    duration        FLOAT,
    preview_path    VARCHAR(1024),                    -- 步骤预览图
    heatmap_path    VARCHAR(1024),                    -- 完整热力图
    anomaly_detected BOOLEAN DEFAULT FALSE,
    error_message   TEXT,
    step_index      INTEGER NOT NULL,                 -- 步骤序号 0-4
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_steps_task ON detection_steps(task_id);
```

#### agent_results

```sql
CREATE TABLE agent_results (
    id              VARCHAR(32) PRIMARY KEY,
    task_id         VARCHAR(32) NOT NULL REFERENCES detection_tasks(id) ON DELETE CASCADE,
    agent_name      VARCHAR(64) NOT NULL,
    label           VARCHAR(128) NOT NULL,
    score           FLOAT NOT NULL,
    heatmap_path    VARCHAR(1024),
    anomaly_regions JSONB DEFAULT '[]',              -- [{x, y, width, height}]
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_results_task ON agent_results(task_id);
```

#### anomaly_evidences

```sql
CREATE TABLE anomaly_evidences (
    id              VARCHAR(32) PRIMARY KEY,          -- anomaly-{rank}
    task_id         VARCHAR(32) NOT NULL REFERENCES detection_tasks(id) ON DELETE CASCADE,
    step_id         VARCHAR(32) REFERENCES detection_steps(id) ON DELETE SET NULL,
    rank            INTEGER NOT NULL,
    title           VARCHAR(512) NOT NULL,
    description     TEXT NOT NULL,
    score           FLOAT NOT NULL,
    heatmap_type    VARCHAR(20) NOT NULL,             -- frequency/noise/semantic/fusion
    region_x        FLOAT,
    region_y        FLOAT,
    region_width    FLOAT,
    region_height   FLOAT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_task ON anomaly_evidences(task_id);
```

#### batch_tasks

```sql
CREATE TABLE batch_tasks (
    id              VARCHAR(32) PRIMARY KEY,          -- batch_xxxxxxxx
    mode            VARCHAR(20) NOT NULL,
    purpose         TEXT DEFAULT '',
    status          VARCHAR(20) DEFAULT 'pending',    -- pending/running/completed/cancelled/partial_failed
    total_count     INTEGER NOT NULL,
    completed_count INTEGER DEFAULT 0,
    failed_count    INTEGER DEFAULT 0,
    parallel_limit  INTEGER DEFAULT 5,
    aggregation     JSONB DEFAULT '{}',               -- {real_count, suspicious_count, ...}
    ws_endpoint     VARCHAR(256),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE batch_items (
    id              VARCHAR(32) PRIMARY KEY,
    batch_id        VARCHAR(32) NOT NULL REFERENCES batch_tasks(id) ON DELETE CASCADE,
    image_id        VARCHAR(32) NOT NULL,
    detection_id    VARCHAR(32),
    status          VARCHAR(20) DEFAULT 'pending',    -- pending/running/completed/error
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batch_items_batch ON batch_items(batch_id);
```

### 2.3 表关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| image → detection_tasks | 1:N | 同一张图可多次检测 |
| detection_task → detection_steps | 1:N | 一次检测包含 1-5 个步骤 |
| detection_task → agent_results | 1:N | 每个Agent产生一条结果 |
| detection_task → anomaly_evidences | 1:N | Top3 异常证据 |
| batch_task → batch_items | 1:N | 批量包含多个子任务 |
| batch_item → detection_task | 1:1 | 每个子任务映射到一次检测 |

---

## 3. 核心模块设计

### 3.1 模块分层

```
┌─────────────────────────────────────────┐
│            API 层（FastAPI）              │
│  路由定义、请求验证、依赖注入、WebSocket   │
├─────────────────────────────────────────┤
│          Service 层（业务逻辑）            │
│  图像管理、检测编排、报告导出              │
├─────────────────────────────────────────┤
│          Engine 层（检测引擎）             │
│  Agent 基类、5个专项 Agent、编排器         │
├─────────────────────────────────────────┤
│          Worker 层（异步任务）             │
│  Celery 任务定义、进度上报                 │
├─────────────────────────────────────────┤
│          Model 层（数据访问）              │
│  SQLAlchemy ORM、数据库迁移                │
└─────────────────────────────────────────┘
```

### 3.2 依赖注入设计 ([deps.py](app/api/deps.py))

```python
# 核心依赖
async def get_db() -> AsyncSession:
    """获取数据库会话"""
    ...

async def get_celery_app() -> Celery:
    """获取 Celery 实例"""
    ...

async def get_image_service(db: AsyncSession = Depends(get_db)) -> ImageService:
    """获取图像服务"""
    ...

async def get_detection_service(
    db: AsyncSession = Depends(get_db),
    celery: Celery = Depends(get_celery_app)
) -> DetectionService:
    """获取检测服务"""
    ...
```

### 3.3 配置管理（[config.py](app/config.py)）

```python
class Settings(BaseSettings):
    # 数据库
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost:5432/deepfake"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # 文件存储
    STORAGE_ROOT: Path = Path("./storage")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_IMAGE_COUNT: int = 100
    
    # 检测引擎
    DETECTION_TIMEOUT: int = 120  # 秒
    DEFAULT_CONFIDENCE_THRESHOLD: float = 0.7
    
    # 模型
    MODEL_DIR: Path = Path("./app/engine/models")
    DEVICE: str = "cuda"  # or "cpu"
```

---

## 4. Agent 编排引擎

### 4.1 整体架构

```
                    ┌──────────────────┐
                    │  Supervisor Agent │  ← 主控 Agent
                    │   (Orchestrator)  │
                    └──────┬───────────┘
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Frequency  │ │   Noise     │ │  Semantic   │
    │   Agent     │ │Consistency  │ │  Structure  │
    │             │ │   Agent     │ │   Agent     │
    └─────────────┘ └─────────────┘ └─────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐ ┌──────────────┐
                    │   Deep      │ │   Open-Set   │
                    │  Feature    │ │Discriminator │
                    │   Agent     │ │    Agent     │
                    └─────────────┘ └──────────────┘
```

**执行顺序（严格串行）**：频域 → 噪声 → 语义 → 深度特征 → 开放集判别

### 4.2 Agent 基类

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class AgentInput:
    image_path: str
    detection_mode: str           # quick / deep / forensic
    purpose: str = ""
    focused_regions: list[dict] = None  # 重点关注区域

@dataclass
class AgentOutput:
    agent_name: str
    label: str
    score: float                  # 0.0 ~ 1.0
    heatmap_path: str | None      # 热力图路径
    preview_path: str | None      # 步骤预览图路径
    anomaly_regions: list[dict]   # 异常区域坐标
    anomaly_detected: bool        # 是否检测到异常
    duration: float               # 执行耗时（秒）
    extra: dict                   # 扩展字段


class BaseAgent(ABC):
    """检测Agent基类"""

    agent_name: str
    label: str

    @abstractmethod
    async def analyze(self, input: AgentInput) -> AgentOutput:
        """执行分析并返回结果"""
        ...

    @abstractmethod
    def is_enabled_for_mode(self, mode: str) -> bool:
        """根据检测模式判断是否启用"""
        ...

    def get_step_config(self) -> dict:
        """返回步骤UI配置（名称、描述）"""
        ...
```

### 4.3 各 Agent 实现要点

#### FrequencyDomainAgent（频域分析）

```python
class FrequencyDomainAgent(BaseAgent):
    agent_name = "FrequencyDomainAgent"
    label = "Frequency Domain Analysis"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        """
        1. 读取图像 → 灰度化
        2. 使用 scipy.fft.fft2 进行二维傅里叶变换
        3. 分析高频分量的能量分布：
           - 计算高频/低频能量比
           - 检测周期性伪影（8x8 / 16x16 网格模式）
           - 识别高频衰减异常（Diffusion 模型典型特征）
        4. 生成频域异常热力图（反向FFT定位异常区域）
        5. 对压缩图像进行高频补偿（自适应阈值）
        """
        ...

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
```

**关键技术栈**：`scipy.fft`, `numpy`, `PIL`

#### NoiseConsistencyAgent（噪声一致性）

```python
class NoiseConsistencyAgent(BaseAgent):
    agent_name = "NoiseConsistencyAgent"
    label = "Noise Consistency Check"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        """
        1. 将图像划分为 N×M 网格（默认 8×6）
        2. 对每个网格单元：
           - 提取噪声残差（原图 - 高斯滤波后）
           - 计算噪声方差和分布规律
        3. 两两比较相邻网格的噪声特征差异
        4. 标注差异超过阈值（> 2.5σ）的区域
        5. 排除光照差异区域（基于梯度判断）
        6. 生成噪声不一致热力图
        """
        ...

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
```

**关键技术栈**：`OpenCV`（cv2.GaussianBlur, cv2.Laplacian）, `numpy`

#### SemanticStructureAgent（语义结构）

```python
class SemanticStructureAgent(BaseAgent):
    agent_name = "SemanticStructureAgent"
    label = "Semantic Structure Verification"

    async def analyze(self, input: AgentInput) -> AgentOutput:
        """
        1. 人物分析（如果图像包含人物）：
           - 调用 MediaPipe / YOLO 进行面部/姿态关键点检测
           - 分析五官比例、肢体比例是否合理
           - 检查面部光影与整体光照是否一致
        2. 光影分析：
           - 估算全局光照方向（基于亮度梯度）
           - 检测阴影方向一致性（分割阴影区域 → 计算偏离角）
        3. 边缘与透视分析：
           - Canny 边缘检测 → 查找拼接痕迹
           - 消失点检测（基于霍夫变换）→ 验证平行线收敛性
        4. 生成语义异常标记图（矩形框 + 标签）
        """
        ...

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode in ("deep", "forensic")
```

**关键技术栈**：`MediaPipe` / `YOLOv8`, `OpenCV` (Canny, HoughLines)

#### DeepFeatureAgent（深度特征）

```python
class DeepFeatureAgent(BaseAgent):
    agent_name = "DeepFeatureAgent"
    label = "Deep Feature Analysis"

    def __init__(self, model_dir: str, device: str):
        # 加载预训练开放集检测模型（支持 ONNX / PyTorch）
        self.model = self._load_model(model_dir, device)
        self.feature_db = self._load_known_features()  # 已知生成模型特征库

    async def analyze(self, input: AgentInput) -> AgentOutput:
        """
        1. 图像预处理（resize, normalize）
        2. 模型前向推理 → 提取深度特征向量（e.g., 512-d embedding）
        3. 与已知生成模型特征库比对（余弦相似度 / 马氏距离）
        4. 若相似度 > threshold（0.7），识别为已知类型，标注模型类别
        5. 输出特征向量（传递给 OpenSetDiscriminator）
        """
        ...

    def is_enabled_for_mode(self, mode: str) -> bool:
        return True  # 所有模式都启用
```

**关键技术栈**：`PyTorch` / `ONNX Runtime`, `transformers`（ViT-based）

#### OpenSetDiscriminator（开放集判别）

```python
class OpenSetDiscriminator(BaseAgent):
    agent_name = "OpenSetDiscriminator"
    label = "Open-Set Discrimination"

    async def analyze(self, input: AgentInput, deep_features: np.ndarray) -> AgentOutput:
        """
        1. 接收 DeepFeatureAgent 的中间特征向量
        2. 计算特征在已知"真实"特征空间中的最近邻距离
        3. 距离超过阈值 → 判为未知生成类型
        4. 分析特征空间中的离群方向，推测可能的攻击类型
        5. 生成 unknown_warning 结构
        """
        ...

    def is_enabled_for_mode(self, mode: str) -> bool:
        return mode != "quick"  # 快速模式跳过
```

### 4.4 Orchestrator（主控编排器）

```python
class SupervisorOrchestrator:
    """主控Agent — 负责调度和分析结果融合"""

    def __init__(self, agents: list[BaseAgent]):
        self.agents = agents
        self.fusion_weights = self._default_weights()

    async def run_pipeline(
        self,
        image_path: str,
        mode: str,
        purpose: str = "",
        progress_callback: callable = None,
    ) -> DetectionPipelineResult:
        """
        核心流水线执行逻辑：

        1. 根据 mode 筛选启用的 agents
        2. 按固定顺序串行执行
        3. 每个 agent 执行完成后：
           a. 收集 AgentOutput
           b. 调用 progress_callback 推送 WebSocket 更新
           c. 若 anomaly_detected 且 score >= 0.8，标记优先区域
        4. 根据 detection_mode 动态调整融合权重
        5. 加权融合所有分数 → 生成 DetectionResult
        6. 若 deep_features 触发 openset 判定 → 生成 unknown_warning
        """
        ...

    def _adjust_weights(self, mode: str, purpose: str) -> dict[str, float]:
        """
        检测模式权重矩阵（动态可调）：

        | Agent      | Quick | Deep | Forensic | 司法场景 |
        |------------|-------|------|----------|---------|
        | Frequency  |  -    | 0.25 | 0.20     | 0.15    |
        | Noise      |  -    | 0.20 | 0.25     | 0.35    |  ← 司法强化
        | Semantic   |  -    | 0.20 | 0.25     | 0.30    |  ← 司法强化
        | DeepFeature| 1.0   | 0.25 | 0.20     | 0.15    |
        | OpenSet    |  -    | 0.10 | 0.10     | 0.05    |
        """
        ...

    def _fuse_results(
        self, agent_outputs: list[AgentOutput], weights: dict
    ) -> tuple[int, float, str, str]:
        """
        1. 加权平均各 Agent score → risk_score (0-100)
        2. 取平均置信度
        3. 根据 risk_score 映射 conclusion:
           0-30  → real
           31-60 → suspicious
           61-90 → ai-generated
           91-100 → unknown
        """
        ...

    def _generate_markdown_report(
        self, outputs, result, mode, image_info
    ) -> str:
        """生成 Markdown 格式的结构化报告"""
        ...
```

### 4.5 模式与 Agent 启用矩阵

| Agent | quick | deep | forensic |
|-------|-------|------|----------|
| FrequencyDomainAgent | ✗ | ✓ | ✓ |
| NoiseConsistencyAgent | ✗ | ✓ | ✓ |
| SemanticStructureAgent | ✗ | ✓ | ✓ |
| DeepFeatureAgent | ✓ | ✓ | ✓ |
| OpenSetDiscriminator | ✗ | ✓ | ✓ |

---

## 5. 异步任务系统

### 5.1 Celery 配置

```python
# app/workers/celery_app.py
from celery import Celery

celery_app = Celery(
    "deepfake_agent",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=120,      # 单任务最大120s
    task_soft_time_limit=110, # 软超时110s（给清理时间）
    worker_max_tasks_per_child=10,  # 每10个任务重启worker（防内存泄漏）
)
```

### 5.2 检测任务定义

```python
# app/workers/detection_task.py
@celery_app.task(bind=True, name="run_detection")
def run_detection(self, task_id: str, image_path: str, mode: str, purpose: str):
    """
    异步执行检测流水线

    通过 self.update_state() 实时更新任务状态
    通过 Redis pub/sub 推送 WebSocket 消息
    """
    orchestrator = get_orchestrator()
    
    async def progress_callback(event: dict):
        # 1. 更新 DB 中的任务状态
        # 2. Redis publish 到 WebSocket 频道
        redis_client.publish(
            f"ws:detection:{task_id}",
            json.dumps(event)
        )
        # 3. 更新 Celery task state
        self.update_state(
            state="PROGRESS",
            meta={"overall_progress": event["overall_progress"]}
        )
    
    # 创建事件循环运行异步编排器
    loop = asyncio.new_event_loop()
    result = loop.run_until_complete(
        orchestrator.run_pipeline(
            image_path=image_path,
            mode=mode,
            purpose=purpose,
            progress_callback=progress_callback,
        )
    )
    loop.close()
    
    return result.to_dict()
```

### 5.3 任务状态机

```
                ┌──────────┐
                │ pending  │  ← 创建检测任务
                └────┬─────┘
                     │ Celery worker 领取
                ┌────▼─────┐
                │  queued  │
                └────┬─────┘
                     │ 开始执行
                ┌────▼─────┐
         ┌─────│ running  │─────┐
         │     └────┬─────┘     │
         │          │           │
    异常/超时   正常完成    用户取消
         │          │           │
    ┌────▼───┐ ┌───▼──────┐ ┌──▼────────┐
    │ error  │ │completed │ │ cancelled  │
    └────────┘ └──────────┘ └────────────┘
```

### 5.4 Service 层调用

```python
# app/services/detection_service.py
class DetectionService:
    def __init__(self, db: AsyncSession, celery: Celery):
        self.db = db
        self.celery = celery

    async def create_detection(
        self, image_id: str, mode: str, purpose: str
    ) -> DetectionTask:
        # 1. 验证图像存在且状态为 uploaded
        # 2. 创建 detection_task 记录 (status=pending)
        # 3. 创建对应的 detection_steps 记录
        # 4. 提交 Celery 任务
        task = run_detection.delay(
            task_id=detection_id,
            image_path=image.storage_path,
            mode=mode,
            purpose=purpose,
        )
        # 5. 更新 task.worker_id
        return detection_task

    async def get_detection_status(self, detection_id: str) -> dict:
        # 查询 DB + 组装响应（含已完成步骤详情）
        ...

    async def cancel_detection(self, detection_id: str) -> None:
        # 1. 检查状态是否可取消 (pending/queued/running)
        # 2. 调用 Celery revoke(task_id, terminate=True)
        # 3. 更新 DB 状态为 cancelled
        ...
```

---

## 6. WebSocket 实时推送

### 6.1 实现方案

```
Client <──WebSocket──> FastAPI <──Redis Pub/Sub──> Celery Worker
```

- FastAPI 负责 WS 连接管理
- Celery Worker 通过 Redis Pub/Sub 发布进度事件
- FastAPI 订阅 Redis 频道并转发给对应 WS 客户端

### 6.2 连接管理器

```python
# app/api/websocket.py
class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # detection_id → set[WebSocket]
        self.active_connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, detection_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[detection_id].add(websocket)

    def disconnect(self, detection_id: str, websocket: WebSocket):
        self.active_connections[detection_id].discard(websocket)
        if not self.active_connections[detection_id]:
            del self.active_connections[detection_id]

    async def broadcast(self, detection_id: str, message: dict):
        dead = set()
        for ws in self.active_connections.get(detection_id, set()):
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                dead.add(ws)
        self.active_connections[detection_id] -= dead


manager = ConnectionManager()

@router.websocket("/ws/detections/{detection_id}")
async def detection_websocket(websocket: WebSocket, detection_id: str):
    await manager.connect(detection_id, websocket)

    # 同时订阅 Redis 频道
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"ws:detection:{detection_id}")

    async def redis_listener():
        """监听 Redis 消息并推送给 WS 客户端"""
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)

    try:
        # 并发：接收客户端消息 + 监听 Redis
        async with asyncio.TaskGroup() as tg:
            tg.create_task(redis_listener())
            tg.create_task(client_handler(websocket, detection_id))
    finally:
        manager.disconnect(detection_id, websocket)
        await pubsub.unsubscribe(f"ws:detection:{detection_id}")
```

---

## 7. 文件存储与图像处理

### 7.1 存储策略

```
storage/
├── images/                       # 原图
│   └── {YYYY-MM}/
│       └── {uuid}.{ext}
├── thumbnails/                   # 缩略图 (256×256)
│   └── {YYYY-MM}/
│       └── {uuid}_thumb.jpg
├── heatmaps/                     # 热力图
│   └── {detection_id}/
│       ├── fusion.png
│       ├── frequency.png
│       ├── noise.png
│       ├── semantic.png
│       └── deepfeature.png
├── previews/                     # 步骤预览图
│   └── {detection_id}/
│       └── {step_type}_preview.png
└── exports/                      # 导出文件
    └── {detection_id}/
        ├── report.pdf
        ├── result.json
        └── images.zip
```

### 7.2 图像处理服务

```python
class ImageProcessor:
    """图像预处理工具"""

    @staticmethod
    def validate(file: bytes, max_size: int) -> tuple[bool, str]:
        """验证文件格式、大小、完整性"""
        ...

    @staticmethod
    def generate_thumbnail(input_path: str, output_path: str, size=(256, 256)):
        """生成缩略图"""
        ...

    @staticmethod
    def auto_compress(input_path: str, max_dim: int = 3840) -> str:
        """自动压缩超尺寸图像"""
        ...

    @staticmethod
    def extract_exif(image_path: str) -> dict:
        """提取 EXIF 元数据"""
        ...
```

---

## 8. 报告生成引擎

### 8.1 报告生成流程

```
DetectionResult → Markdown 渲染 → HTML → PDF
                                   → JSON 导出
                                   → 图片打包
```

### 8.2 实现方案

```python
class ReportGenerator:
    """报告生成器"""

    def __init__(self, detection_result: DetectionResult, template_dir: str):
        self.result = detection_result
        self.templates = template_dir

    def render_markdown(self) -> str:
        """
        使用 Jinja2 模板渲染 Markdown 报告：
        - 封面信息
        - 核心结论卡片
        - 各 Agent 证据总结
        - 未知预警详情
        - 人工复核建议
        - 附录
        """
        template = self.templates / "report.md.j2"
        return Template(template.read_text()).render(result=self.result)

    def export_pdf(self, output_path: str) -> None:
        """
        Markdown → HTML → WeasyPrint → PDF
        1. 使用 markdown 库将 MD 转 HTML
        2. 注入 CSS 样式（热力图嵌入、卡片布局）
        3. WeasyPrint 渲染为 PDF
        """
        html = markdown.markdown(self.render_markdown(), extensions=['tables', 'fenced_code'])
        styled_html = self._inject_styles(html)
        HTML(string=styled_html).write_pdf(output_path)

    def export_json(self, output_path: str) -> None:
        """导出结构化 JSON 数据"""
        with open(output_path, 'w') as f:
            json.dump(self.result.to_dict(), f, indent=2, default=str)

    def export_image_package(self, output_path: str) -> None:
        """打包原图 + 热力图 + 标记图为 ZIP"""
        with ZipFile(output_path, 'w') as zf:
            zf.write(self.result.original_image, "original/image.png")
            for agent in self.result.agent_results:
                if agent.heatmap_path:
                    zf.write(agent.heatmap_path, f"heatmaps/{agent.agent_name}.png")
```

### 8.3 报告埋点数据

每次导出操作记录：
- 导出格式
- 导出时间
- 报告大小
- 用户标识（预留）

用于后续使用分析和功能优化。

---

## 9. 部署架构

### 9.1 Docker Compose 开发环境

```yaml
# docker-compose.yml
services:
  api:
    build: .
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    volumes:
      - ./storage:/app/storage
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/deepfake
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  worker:
    build: .
    command: celery -A app.workers.celery_app worker --concurrency=4
    volumes:
      - ./storage:/app/storage
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/deepfake
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  db:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: deepfake

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

### 9.2 生产部署建议

| 组件 | 推荐方案 |
|------|---------|
| API 网关 | Nginx（反向代理 + 限流） |
| WSGI 服务器 | Gunicorn + Uvicorn Workers |
| 数据库 | PostgreSQL 15 + 读写分离 |
| 文件存储 | MinIO / AWS S3（对象存储） |
| GPU Worker | 独立 GPU 实例（单 worker/GPU） |
| 消息队列 | Redis（轻量）或 RabbitMQ（可靠性优先） |
| 监控 | Prometheus + Grafana |
| 日志 | structlog → ELK Stack |

---

## 10. 安全与性能考量

### 10.1 安全措施

| 类别 | 措施 |
|------|------|
| 文件上传 | 魔术字节校验、文件大小限制、病毒扫描（ClamAV） |
| 路径遍历 | 所有文件路径使用 UUID 命名，禁止用户输入拼接 |
| SQL 注入 | ORM 参数化查询，禁止拼接 SQL |
| 资源耗尽 | API 限流（slowapi）、任务并发限制、图像数量限制 |
| 数据安全 | 上传图像 24h 后自动清理策略（可配置）、传输 HTTPS |
| 隐私保护 | 可选的数据本地化存储、手动删除接口 |

### 10.2 性能优化

| 策略 | 实现 |
|------|------|
| 数据库连接池 | asyncpg pool_size=20, max_overflow=10 |
| 图像预缩放 | 上传时自动生成缩略图，原图按需访问 |
| 热力图缓存 | 相同参数的热力图缓存 1 小时 |
| 模型预热 | Worker 启动时预加载模型到 GPU |
| 批量优化 | 批量检测复用模型推理（batching） |
| 静态文件 | Nginx 直接伺服 storage 目录，跳过 Python |
