# LensPro Warehouse Manager

English | [简体中文](./README.zh-CN.md)

A desktop + backend warehouse management system for tracking inventory, outbound reports, and attachment uploads.

## Project Structure

```text
LensProWarehouseManager/
├── app/                  # Electron desktop client
└── warehouseserver/      # Spring Boot backend service
```

## Key Features

- **Warehouse item management**: create/update items, tags, notes, thumbnails, and status.
- **Outbound workflow**: submit outbound reports with attachments and finish orders to return items.
- **Operation logs**: query recent in/out operations.
- **Cross-platform desktop client**: Electron-based app with tray integration and version checks.

## Tech Stack

### Desktop App (`app/`)

- Electron (`37.5.0` packaged tarball)
- Node.js + CommonJS
- SQLite (`sqlite`, `sqlite3`) for local/session-related data

### Backend (`warehouseserver/`)

- Java 17
- Spring Boot (Web MVC, JDBC, Security)
- MyBatis
- MySQL Connector/J
- Gson, ZXing, Thumbnailator, WebP ImageIO

## Prerequisites

- **Node.js + npm** (for `app/`)
- **Java 17** (for backend build/run)
- **MySQL** (for backend database)
- **Maven** (or use included Maven Wrapper)

## Quick Start

> The repository currently includes environment-specific config values. Please replace them with your own local/dev configuration before running.

### 1) Configure Backend

Edit `warehouseserver/application.properties` and configure at least:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `server.port`

Then start backend:

```bash
cd warehouseserver
./mvnw spring-boot:run
```

Backend default API base path examples:

- `GET /api/warehouse/get_list`
- `POST /api/warehouse/add`
- `POST /api/outbound_report/addA`

### 2) Configure Desktop Client

Edit `app/config.ini`:

```ini
url=http://<your-backend-host>:<port>
```

Install dependencies and start desktop app:

```bash
cd app
npm install
npm start
```

## Development Notes

- The desktop app validates version on startup; if version is obsolete, it exits with an error dialog.
- Backend file uploads are saved under `warehouseserver/data/uploads/` by default.
- Static assets for web pages are in `warehouseserver/src/main/resources/static/`.

## Testing

### Backend

```bash
cd warehouseserver
./mvnw test
```

### Desktop

No automated test script is defined in `app/package.json` currently. You can verify by launching the app with `npm start`.

## Security Recommendations

- Never commit real production DB credentials.
- Restrict CORS in production.
- Protect upload directories and enforce strict file validation.
- Consider introducing environment-based config management (`.env`, secrets manager, or Spring profiles).

## License

This repository currently does not define an explicit license. Add one if you plan to distribute it.
