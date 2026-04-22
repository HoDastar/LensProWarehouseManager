window.isInventoryItemInStock = function isInventoryItemInStock(item) {
    return item.status === 0 || item.status === false || item.status === "0";
};

window.getInventoryThumbnailUrl = function getInventoryThumbnailUrl(thumbnail) {
    if (!thumbnail) {
        return `${window.url}/data/static/noPhoto.jpg`;
    }
    if (/^https?:\/\//.test(thumbnail) || thumbnail.startsWith("data:")) {
        return thumbnail;
    }
    return `${window.url}${thumbnail}`;
};

window.getInventoryListText = function getInventoryListText(list) {
    if (Array.isArray(list)) {
        return list.join("\n");
    }
    return String(list || "");
};

window.renderOverviewData = function renderOverviewData() {
    var allTags = Object.keys(window.inventoryTagGroups).reduce(function (result, groupName) {
        return result.concat(window.inventoryTagGroups[groupName]);
    }, []);
    var inStockCount = window.inventoryAllData.filter(function (item) { return window.isInventoryItemInStock(item); }).length;
    document.getElementById("overviewTotalCount").textContent = window.inventoryAllData.length;
    document.getElementById("overviewInStockCount").textContent = inStockCount;
    document.getElementById("overviewOutStockCount").textContent = window.inventoryAllData.length - inStockCount;
    document.getElementById("overviewTagCount").textContent = allTags.length;
};

function padDateNumber(value) {
    return String(value).padStart(2, "0");
}

function formatLogTime(timestamp) {
    var date = new Date(Number(timestamp));
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    return date.getFullYear() + "-"
        + padDateNumber(date.getMonth() + 1) + "-"
        + padDateNumber(date.getDate()) + " "
        + padDateNumber(date.getHours()) + ":"
        + padDateNumber(date.getMinutes()) + ":"
        + padDateNumber(date.getSeconds());
}

function formatWarehouseLogText(log) {
    var actionMap = { 0: "入库", 1: "出库", 2: "添加", 3: "删除" };
    var action = actionMap[Number(log.type)] || "更新";
    var itemName = log.name || "未知项目";
    var itemNo = log.noid ? "（" + log.noid + "）" : "";
    return itemName + itemNo + "已" + action;
}

function renderOverviewLogs(logs) {
    var logsRoot = document.getElementById("overviewCurrentLogs");
    logsRoot.innerHTML = "";

    if (!Array.isArray(logs) || !logs.length) {
        var empty = document.createElement("div");
        empty.className = "overview-list-row";
        empty.innerHTML = "<span>暂无近期动态</span><strong></strong>";
        logsRoot.append(empty);
        return;
    }

    logs.forEach(function (log) {
        var row = document.createElement("div");
        row.className = "overview-list-row";

        var text = document.createElement("span");
        text.textContent = formatWarehouseLogText(log);

        var time = document.createElement("strong");
        time.textContent = formatLogTime(log.time);

        row.append(text, time);
        logsRoot.append(row);
    });
}

window.loadOverviewCurrentLogs = async function loadOverviewCurrentLogs() {
    const result = await getApi(`${window.url}/api/warehouse/get_current_logs`);
    if (result && result.result === false) {
        Showbubble(result.msg || "近期动态加载失败", "#d90000", "#ffffff");
        renderOverviewLogs([]);
        return [];
    }

    var logs = window.normalizeApiData(result, []);
    logs = Array.isArray(logs) ? logs : [];
    renderOverviewLogs(logs);
    return logs;
};
