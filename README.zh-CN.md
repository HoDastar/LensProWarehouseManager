# LensPro 仓库管理系统

[English](./README.md) | 简体中文

这是一个“桌面端 + 后端服务”的仓库管理系统，用于管理库存项目、出库报告与附件上传。

## 项目结构

```text
LensProWarehouseManager/
├── app/                  # Electron 桌面客户端
└── warehouseserver/      # Spring Boot 后端服务
```

## 核心功能

- **仓库项目管理**：支持项目新增、修改、标签、备注、缩略图与状态管理。
- **出库流程**：支持携带附件提交出库报告，并可完结订单后完成入库回滚。
- **操作日志**：可查询近期出入库操作记录。
- **跨平台桌面应用**：基于 Electron，包含托盘与版本校验能力。

## 技术栈

### 桌面端（`app/`）

- Electron（本地打包版本 `37.5.0`）
- Node.js + CommonJS
- SQLite（`sqlite`、`sqlite3`）

### 后端（`warehouseserver/`）

- Java 17
- Spring Boot（Web MVC / JDBC / Security）
- MyBatis
- MySQL Connector/J
- Gson、ZXing、Thumbnailator、WebP ImageIO

## 环境要求

- **Node.js + npm**（用于 `app/`）
- **Java 17**（用于后端编译/运行）
- **MySQL**（后端数据库）
- **Maven**（或使用仓库内 Maven Wrapper）

## 快速开始

> 当前仓库内存在环境专用配置值，运行前请先改为你自己的本地/开发环境配置。

### 1）配置后端

编辑 `warehouseserver/application.properties`，至少配置以下字段：

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `server.port`

启动后端：

```bash
cd warehouseserver
./mvnw spring-boot:run
```

后端 API 示例路径：

- `GET /api/warehouse/get_list`
- `POST /api/warehouse/add`
- `POST /api/outbound_report/addA`

### 2）配置桌面端

编辑 `app/config.ini`：

```ini
url=http://<你的后端地址>:<端口>
```

安装依赖并启动桌面端：

```bash
cd app
npm install
npm start
```

## 开发说明

- 桌面端启动时会进行版本校验，若版本过期会弹窗并退出。
- 后端上传文件默认保存到 `warehouseserver/data/uploads/`。
- 后端静态资源位于 `warehouseserver/src/main/resources/static/`。

## 测试

### 后端

```bash
cd warehouseserver
./mvnw test
```

### 桌面端

当前 `app/package.json` 未定义自动化测试脚本，可通过 `npm start` 进行基本启动验证。

## 安全建议

- 不要提交真实生产数据库凭据。
- 生产环境请收紧 CORS 策略。
- 保护上传目录并强化文件格式/大小校验。
- 建议引入环境分离配置（如 `.env`、密钥管理或 Spring Profile）。

## License

当前仓库未声明明确开源协议，如需分发请补充 License。
