# DeepFakeAgent 后端 API 接口文档

> 版本：v1.0 | 协议：RESTful + WebSocket | 基础路径：`/api/v1`
> 所有请求/响应体使用 JSON 格式，时间字段使用 ISO 8601 标准。

---

## 目录

1. [通用规范](#1-通用规范)
2. [图像管理 API](#2-图像管理-api)
3. [检测任务 API](#3-检测任务-api)
4. [WebSocket 实时推送](#4-websocket-实时推送)
5. [报告导出 API](#5-报告导出-api)
6. [批量检测 API](#6-批量检测-api)
7. [错误码参考](#7-错误码参考)

---

## 1. 通用规范

### 1.1 请求头

```
Content-Type: application/json
Accept: application/json
```

文件上传使用 `multipart/form-data`。

### 1.2 响应信封

所有成功响应包装为：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

分页响应额外包含分页信息：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 1.3 错误响应

```json
{
  "code": 40001,
  "message": "图像文件大小超过10MB限制",
  "detail": "当前文件大小: 15.2MB"
}
```

---

## 2. 图像管理 API

### 2.1 上传图像

```
POST /api/v1/images/upload
Content-Type: multipart/form-data
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| files | File[] | 是 | 图像文件列表，单次最多100张 |
| purpose | string | 否 | 检测目的备注 |

**约束**
- 单张 ≤ 10MB
- 分辨率建议 ≤ 4K (3840×2160)
- 格式：JPG, PNG, WebP, TIFF, BMP

**成功响应** `201 Created`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "images": [
      {
        "id": "img_3f7a2b01",
        "original_name": "sample.jpg",
        "size": 2456789,
        "width": 2048,
        "height": 1536,
        "format": "JPEG",
        "preview_url": "/api/v1/images/img_3f7a2b01/preview",
        "thumbnail_url": "/api/v1/images/img_3f7a2b01/thumbnail",
        "created_at": "2026-05-05T10:30:00Z"
      }
    ],
    "failed": [
      {
        "original_name": "too_large.png",
        "reason": "file_size_exceeded",
        "message": "文件大小 15.2MB 超过 10MB 限制"
      }
    ]
  }
}
```

### 2.2 获取图像列表

```
GET /api/v1/images?page=1&page_size=20&sort=created_at&order=desc
```

**查询参数**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量 (max 100) |
| sort | string | created_at | 排序字段 |
| order | string | desc | asc / desc |
| status | string | - | 过滤：pending / detecting / completed / error |

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "images": [
      {
        "id": "img_3f7a2b01",
        "original_name": "sample.jpg",
        "size": 2456789,
        "width": 2048,
        "height": 1536,
        "format": "JPEG",
        "preview_url": "/api/v1/images/img_3f7a2b01/preview",
        "thumbnail_url": "/api/v1/images/img_3f7a2b01/thumbnail",
        "status": "completed",
        "detection_id": "det_8b4c1e02",
        "created_at": "2026-05-05T10:30:00Z"
      }
    ]
  },
  "pagination": { "page": 1, "page_size": 20, "total": 42, "total_pages": 3 }
}
```

### 2.3 获取图像详情

```
GET /api/v1/images/{image_id}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "img_3f7a2b01",
    "original_name": "sample.jpg",
    "size": 2456789,
    "width": 2048,
    "height": 1536,
    "format": "JPEG",
    "exif": {
      "camera_model": "Canon EOS R5",
      "lens": "RF 24-70mm f/2.8",
      "focal_length": "35mm",
      "aperture": "f/4.0",
      "shutter_speed": "1/250",
      "iso": 400,
      "taken_at": "2025-12-15T14:22:00Z",
      "gps": { "latitude": 31.2304, "longitude": 121.4737 }
    },
    "preview_url": "/api/v1/images/img_3f7a2b01/preview",
    "thumbnail_url": "/api/v1/images/img_3f7a2b01/thumbnail",
    "status": "completed",
    "created_at": "2026-05-05T10:30:00Z"
  }
}
```

### 2.4 删除图像

```
DELETE /api/v1/images/{image_id}
```

**响应** `204 No Content`

---

## 3. 检测任务 API

### 3.1 创建检测任务

```
POST /api/v1/detections
Content-Type: application/json
```

**请求体**

```json
{
  "image_ids": ["img_3f7a2b01"],
  "mode": "deep",
  "purpose": "新闻验证"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image_ids | string[] | 是 | 待检测图像ID列表（单张≤1，批量见§6） |
| mode | string | 是 | quick / deep / forensic |
| purpose | string | 否 | 检测目的，辅助优化策略 |
| callback_url | string | 否 | 完成后的webhook回调URL |

**检测模式说明**

| 模式 | step列表 | 预期耗时 | 输出内容 |
|------|----------|----------|----------|
| quick | [DeepFeature] | ≤3s | 分数 + 风险等级 |
| deep | [Frequency, Noise, Semantic, DeepFeature, OpenSet] | ≤10s | 全套：分数、热力图、异常Top3 |
| forensic | [Frequency, Noise, Semantic, DeepFeature, OpenSet] + 证据聚合 | ≤20s | 深度全套 + 结构化报告 |

**成功响应** `201 Created`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "detection_id": "det_8b4c1e02",
    "status": "pending",
    "mode": "deep",
    "image_id": "img_3f7a2b01",
    "ws_endpoint": "/api/v1/ws/detections/det_8b4c1e02",
    "created_at": "2026-05-05T10:35:00Z",
    "estimated_duration": 10
  }
}
```

### 3.2 获取检测任务状态

```
GET /api/v1/detections/{detection_id}
```

**响应（检测中）**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "detection_id": "det_8b4c1e02",
    "status": "running",
    "mode": "deep",
    "overall_progress": 45,
    "current_step": {
      "id": "noise",
      "agent_name": "NoiseConsistencyAgent",
      "label": "Noise Consistency Check",
      "status": "running",
      "started_at": "2026-05-05T10:35:03Z"
    },
    "completed_steps": [
      {
        "id": "frequency",
        "agent_name": "FrequencyDomainAgent",
        "label": "Frequency Domain Analysis",
        "status": "completed",
        "score": 0.87,
        "duration": 1.2,
        "preview_url": "/api/v1/detections/det_8b4c1e02/heatmaps/frequency/preview"
      }
    ],
    "created_at": "2026-05-05T10:35:00Z",
    "updated_at": "2026-05-05T10:35:04Z"
  }
}
```

**响应（已完成）**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "detection_id": "det_8b4c1e02",
    "status": "completed",
    "mode": "deep",
    "overall_progress": 100,
    "result": {
      "risk_score": 76,
      "confidence": 0.92,
      "conclusion": "ai-generated",
      "conclusion_label": "High Probability AI-Generated",
      "total_duration": 7.4,
      "fusion_heatmap_url": "/api/v1/detections/det_8b4c1e02/heatmaps/fusion",
      "agent_results": [
        {
          "agent_name": "FrequencyDomainAgent",
          "label": "Frequency Analysis",
          "score": 0.87,
          "heatmap_url": "/api/v1/detections/det_8b4c1e02/heatmaps/frequency"
        },
        {
          "agent_name": "NoiseConsistencyAgent",
          "label": "Noise Consistency",
          "score": 0.72,
          "heatmap_url": "/api/v1/detections/det_8b4c1e02/heatmaps/noise"
        },
        {
          "agent_name": "SemanticStructureAgent",
          "label": "Semantic Structure",
          "score": 0.78,
          "heatmap_url": "/api/v1/detections/det_8b4c1e02/heatmaps/semantic"
        },
        {
          "agent_name": "DeepFeatureAgent",
          "label": "Deep Features",
          "score": 0.81,
          "heatmap_url": "/api/v1/detections/det_8b4c1e02/heatmaps/deepfeature"
        }
      ],
      "anomalies": [
        {
          "id": "anomaly-1",
          "rank": 1,
          "title": "High-frequency energy attenuation in facial region",
          "description": "Frequency domain analysis detected abnormal high-frequency decay pattern...",
          "score": 0.87,
          "heatmap_type": "frequency",
          "region": { "x": 35, "y": 20, "width": 30, "height": 40 }
        }
      ],
      "unknown_warning": null
    },
    "report_url": "/api/v1/detections/det_8b4c1e02/report",
    "created_at": "2026-05-05T10:35:00Z",
    "completed_at": "2026-05-05T10:35:08Z"
  }
}
```

### 3.3 获取检测任务列表

```
GET /api/v1/detections?page=1&page_size=20&status=completed&mode=deep
```

### 3.4 取消检测任务

```
POST /api/v1/detections/{detection_id}/cancel
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": { "detection_id": "det_8b4c1e02", "status": "cancelled" }
}
```

### 3.5 获取热力图

```
GET /api/v1/detections/{detection_id}/heatmaps/{heatmap_type}
```

| heatmap_type | 说明 |
|--------------|------|
| fusion | 融合总热力图（默认） |
| frequency | 频域异常热力图 |
| noise | 噪声不一致热力图 |
| semantic | 语义异常标记图 |
| deepfeature | 深度特征可解释性热力图 |

**查询参数**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| format | string | png | png / jpg |
| overlay | bool | true | 是否叠加到原图 |

**响应** `200 OK` — 图像二进制流 (image/png)

---

## 4. WebSocket 实时推送

### 4.1 连接

```
ws://host/api/v1/ws/detections/{detection_id}
```

客户端连接后立即发送订阅消息：

```json
{
  "type": "subscribe",
  "detection_id": "det_8b4c1e02"
}
```

### 4.2 服务端推送消息类型

#### step_started — 步骤开始

```json
{
  "type": "step_started",
  "detection_id": "det_8b4c1e02",
  "step": {
    "id": "frequency",
    "agent_name": "FrequencyDomainAgent",
    "label": "Frequency Domain Analysis",
    "description": "Analyzing high-frequency spatial distributions and generative model residuals",
    "step_index": 0,
    "total_steps": 5,
    "started_at": "2026-05-05T10:35:01Z"
  },
  "overall_progress": 0
}
```

#### step_progress — 步骤进行中

```json
{
  "type": "step_progress",
  "detection_id": "det_8b4c1e02",
  "step_id": "frequency",
  "progress": 65,
  "overall_progress": 13,
  "preview_url": "/api/v1/detections/det_8b4c1e02/heatmaps/frequency/preview"
}
```

#### step_completed — 步骤完成

```json
{
  "type": "step_completed",
  "detection_id": "det_8b4c1e02",
  "step": {
    "id": "frequency",
    "agent_name": "FrequencyDomainAgent",
    "label": "Frequency Domain Analysis",
    "status": "completed",
    "score": 0.87,
    "duration": 1.2,
    "preview_url": "/api/v1/detections/det_8b4c1e02/heatmaps/frequency"
  },
  "overall_progress": 20,
  "anomaly_detected": true,
  "alert_message": "Frequency domain found high-frequency anomalies, suspicious regions marked"
}
```

#### step_error — 步骤出错

```json
{
  "type": "step_error",
  "detection_id": "det_8b4c1e02",
  "step_id": "noise",
  "error_message": "Insufficient image resolution for noise analysis",
  "recoverable": true,
  "overall_progress": 40
}
```

#### detection_completed — 检测完成

```json
{
  "type": "detection_completed",
  "detection_id": "det_8b4c1e02",
  "status": "completed",
  "summary": {
    "risk_score": 76,
    "conclusion": "ai-generated",
    "conclusion_label": "High Probability AI-Generated",
    "confidence": 0.92,
    "total_duration": 7.4
  },
  "result_url": "/api/v1/detections/det_8b4c1e02"
}
```

### 4.3 客户端消息

| type | 说明 |
|------|------|
| subscribe | 订阅检测进度 {detection_id} |
| unsubscribe | 取消订阅 |
| ping | 心跳保活 |

### 4.4 心跳

服务端每 30 秒发送 `{"type": "ping"}`，客户端应在 10 秒内回复 `{"type": "pong"}`。

---

## 5. 报告导出 API

### 5.1 获取报告数据

```
GET /api/v1/detections/{detection_id}/report
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "report": {
      "detection_time": "2026-05-05T10:35:00Z",
      "image_name": "sample.jpg",
      "detection_mode": "deep",
      "detection_purpose": "新闻验证",
      "result": { "...": "完整的 DetectionResult 对象" },
      "report_markdown": "# DeepFake Detection Report\n\n..."
    }
  }
}
```

### 5.2 导出 PDF

```
GET /api/v1/detections/{detection_id}/export/pdf
```

**查询参数**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| include_heatmaps | bool | true | 是否包含热力图 |
| template | string | default | 报告模板 |

**响应** `200 OK` — application/pdf 二进制流

### 5.3 导出 JSON

```
GET /api/v1/detections/{detection_id}/export/json
```

**响应** `200 OK` — application/json 下载

### 5.4 导出图片包

```
GET /api/v1/detections/{detection_id}/export/images
```

**响应** `200 OK` — application/zip 下载，包含：
- `original/` — 原图
- `heatmaps/` — 4种热力图（fusion / frequency / noise / semantic）
- `annotated/` — 语义异常标记图
- `metadata.json` — 检测元数据

---

## 6. 批量检测 API

### 6.1 创建批量检测

```
POST /api/v1/batch-detections
Content-Type: application/json
```

**请求体**

```json
{
  "image_ids": ["img_001", "img_002", "...", "img_100"],
  "mode": "quick",
  "purpose": "批量新闻图片筛选",
  "parallel_limit": 5
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image_ids | string[] | 是 | 图像ID列表，≤100 |
| mode | string | 是 | 检测模式 |
| purpose | string | 否 | 检测目的 |
| parallel_limit | int | 否 | 并发数，默认5，最大10 |

**成功响应** `201 Created`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "batch_id": "batch_9d2e5f03",
    "total_images": 50,
    "status": "pending",
    "ws_endpoint": "/api/v1/ws/batch/batch_9d2e5f03",
    "created_at": "2026-05-05T10:40:00Z",
    "estimated_total_duration": 150
  }
}
```

### 6.2 查询批量检测状态

```
GET /api/v1/batch-detections/{batch_id}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "batch_id": "batch_9d2e5f03",
    "status": "running",
    "total_images": 50,
    "completed": 18,
    "failed": 2,
    "running": 5,
    "pending": 25,
    "overall_progress": 40,
    "aggregation": {
      "real_count": 30,
      "suspicious_count": 8,
      "ai_generated_count": 10,
      "unknown_count": 2
    },
    "created_at": "2026-05-05T10:40:00Z"
  }
}
```

### 6.3 获取批量检测全部结果

```
GET /api/v1/batch-detections/{batch_id}/results?page=1&page_size=20
```

### 6.4 取消批量检测

```
POST /api/v1/batch-detections/{batch_id}/cancel
```

### 6.5 批量 WebSocket

```
ws://host/api/v1/ws/batch/{batch_id}
```

推送频率：每完成一次子任务推送 batch_progress 消息。

```json
{
  "type": "batch_progress",
  "batch_id": "batch_9d2e5f03",
  "completed": 18,
  "total": 50,
  "overall_progress": 40,
  "last_completed": {
    "image_id": "img_015",
    "detection_id": "det_x015",
    "risk_score": 42,
    "conclusion": "suspicious"
  }
}
```

---

## 7. 错误码参考

### 7.1 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| 0 | 200/201 | 成功 |
| 40001 | 400 | 请求参数错误 |
| 40002 | 400 | 文件格式不支持 |
| 40003 | 400 | 文件大小超限 |
| 40004 | 400 | 图像数量超限 |
| 40101 | 401 | 未认证（预留） |
| 40301 | 403 | 无权限（预留） |
| 40401 | 404 | 资源不存在 |
| 40402 | 404 | 检测任务不存在 |
| 40901 | 409 | 资源状态冲突（如任务已完成） |
| 41301 | 413 | 请求体过大 |
| 42901 | 429 | 请求频率超限 |
| 50001 | 500 | 服务器内部错误 |
| 50002 | 500 | 检测引擎异常 |
| 50003 | 500 | 文件处理异常 |
| 50301 | 503 | 服务暂时不可用 |

### 7.2 业务错误码

| 错误码 | 说明 |
|--------|------|
| 41001 | 图像已损坏，无法读取 |
| 41002 | 图像分辨率过低（< 64×64） |
| 41003 | 检测模型加载失败 |
| 41004 | 检测任务超时（> 120s） |
| 41005 | 批量检测部分失败 |
| 41006 | 报告生成失败 |

---

## 附录 A：检测结果结论枚举

| conclusion 值 | conclusion_label | 风险评分范围 |
|---------------|------------------|-------------|
| real | Real Image | 0–30 |
| suspicious | Suspicious — Possibly Forged | 31–60 |
| ai-generated | High Probability AI-Generated | 61–90 |
| unknown | Unknown Generation — Warning | 91–100 |

## 附录 B：南北向交互时序

```
Client                           Server
  |                                 |
  |-- POST /images/upload -------->|  上传图像
  |<-- 201 {image_id} ------------|
  |                                 |
  |-- POST /detections ----------->|  创建检测任务
  |<-- 201 {detection_id, ws} -----|
  |                                 |
  |-- WS connect /ws/detections/-->|  WebSocket连接
  |-- {type:subscribe} ----------->|
  |<-- step_started --------------|  频域分析开始
  |<-- step_completed ------------|  频域分析完成
  |<-- step_started --------------|  噪声分析开始
  |<-- step_completed ------------|  噪声分析完成 (标记异常)
  |<-- step_started --------------|  语义分析开始
  |<-- step_completed ------------|  语义分析完成
  |<-- step_started --------------|  深度特征分析开始
  |<-- step_completed ------------|  深度特征分析完成
  |<-- step_started --------------|  开放集判别开始
  |<-- step_completed ------------|  开放集判别完成
  |<-- detection_completed -------|  检测完成
  |                                 |
  |-- WS disconnect --------------|
  |                                 |
  |-- GET /detections/{id} ------>|  获取完整结果
  |<-- 200 {result} --------------|
  |                                 |
  |-- GET /export/pdf ------------>|  导出PDF报告
  |<-- 200 application/pdf --------|
```
