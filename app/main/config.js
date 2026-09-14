const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const VERSION = "0.2.0";
const BUILD = 2;
const iniPath = path.join(app.getPath('userData'), 'data', 'config.ini');
const DEFAULT_URL = "http://127.0.0.1:8080";

let token = "";

// 解析INI文件内容为对象
function parseIni(content) {
  return content.split(/\r?\n/).reduce((config, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(";")) {
      return config;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return config;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key) {
      config[key] = value;
    }
    return config;
  }, {});
}

function readUrlConfig() {
  console.log("Reading URL config...");
  if (!fs.existsSync(iniPath)) {
    fs.mkdirSync(path.dirname(iniPath), { recursive: true });
    fs.writeFileSync(iniPath, `url=${DEFAULT_URL}`, "utf8");
    return DEFAULT_URL;
  }
  return parseIni(fs.readFileSync(iniPath, "utf8")).url || DEFAULT_URL;
}

function getUrl() {
  return readUrlConfig()|| "";
}

function setToken(value) {
  token = value == null ? "" : String(value);
}

function getToken() {
  return token;
}

function getRendererConfig() {
  return {
    url: getUrl(),
    token: getToken(),
    version: VERSION,
    build: BUILD
  };
}

async function checkVersion() {
  try {
  const respond = await fetch(getUrl() + "/api/config/get_version");
  const result = await respond.json();
  console.log(result);
  if (!result.result) {
    return false;
  }
  
  const buildSQL = result.data
  if (buildSQL > BUILD) {
    return false;
  }
  } catch (error) {
    return false;
  }

  return true;
}

module.exports = {
  VERSION,
  BUILD,
  getUrl,
  setToken,
  getToken,
  getRendererConfig,
  checkVersion
};
