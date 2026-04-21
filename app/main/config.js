const fs = require("fs");
const path = require("path");

const VERSION = "0.0";
const BUILD = 0;
const iniPath = path.join(__dirname, "..", "config.ini");

let token = "";

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

function readIniConfig() {
  if (!fs.existsSync(iniPath)) {
    return {};
  }

  return parseIni(fs.readFileSync(iniPath, "utf8"));
}

function getUrl() {
  return readIniConfig().url || "";
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
