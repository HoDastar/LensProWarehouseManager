window.loadOutboundUploadFileCount = async function loadOutboundUploadFileCount() {
    var countEl = document.getElementById("outboundUploadFileCount");
    if (!countEl) return 0;
    countEl.textContent = "加载中";
    const result = await getApi(`${window.url}/api/attachment/get_photos`);
    if (!result.result || !Array.isArray(result.data)) {
        countEl.textContent = "0";
        Showbubble(result.msg || "上传文件数加载失败", "#d90000", "#ffffff");
        return 0;
    }
    countEl.textContent = String(result.data.length);
    return result.data.length;
};

window.loadInboundUploadFileCount = async function loadInboundUploadFileCount() {
    var countEl = document.getElementById("inboundUploadFileCount");
    if (!countEl) return 0;
    countEl.textContent = "加载中";
    const result = await getApi(`${window.url}/api/attachment/get_photos`);
    if (!result.result || !Array.isArray(result.data)) {
        countEl.textContent = "0";
        Showbubble(result.msg || "上传文件数加载失败", "#d90000", "#ffffff");
        return 0;
    }
    countEl.textContent = String(result.data.length);
    return result.data.length;
};

window.openUploadPage = async function openUploadPage() {
    const result = await window.warehouseBrowser.openLink(`${window.url}/upload.html`);
    if (!result || !result.ok) {
        Showbubble(result && result.message ? result.message : "打开上传页面失败", "#d90000", "#ffffff");
    }
};

function parseOutboundGoodsList(goods) {
    if (Array.isArray(goods)) return goods;
    if (typeof goods !== "string" || !goods.trim()) return [];
    try {
        var parsed = JSON.parse(goods);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return goods.split(",").map(function (item) { return item.trim(); }).filter(Boolean);
    }
}

function findOutboundReportById(orderId) {
    return window.outboundReportAllData.find(function (report) {
        return String(report.id) === String(orderId);
    }) || null;
}

window.fetchOutboundReportById = async function fetchOutboundReportById(orderId) {
    if (!orderId) return null;

    const detailResult = await getApi(`${window.url}/api/order/get_outbound_report?id=${encodeURIComponent(orderId)}`);
    if (detailResult && detailResult.result !== false) {
        var detailData = window.normalizeApiData(detailResult, null);
        if (Array.isArray(detailData)) {
            var matchedDetail = detailData.find(function (report) {
                return String(report.id) === String(orderId);
            });
            if (matchedDetail) return matchedDetail;
        } else if (detailData && String(detailData.id) === String(orderId)) {
            return detailData;
        }
    }

    if (!window.outboundReportAllData.length) {
        await window.fetchOutboundReportData();
    }
    return findOutboundReportById(orderId);
};

window.renderOutboundQueue = function renderOutboundQueue() {
    var queueRoot = document.getElementById("outboundQueueList");
    if (!queueRoot) return;
    queueRoot.innerHTML = "";

    if (!window.outboundQueue.length) {
        var empty = document.createElement("div");
        empty.className = "outbound-empty";
        empty.textContent = "暂无出库项目";
        queueRoot.append(empty);
        return;
    }

    window.outboundQueue.forEach(function (item) {
        var row = document.createElement("div");
        var listText = window.getInventoryListText(item.list);
        row.className = "outbound-queue-item";
        row.innerHTML = `
            <div class="outbound-queue-id">${item.id}</div>
            <div class="outbound-queue-grid">
                <div class="outbound-queue-main">
                    <img class="outbound-queue-thumbnail" src="${window.getInventoryThumbnailUrl(item.thumbnail)}" alt="${item.name || item.id}">
                    <div class="outbound-queue-info">
                        <div class="outbound-queue-name">${item.name || ""}</div>
                        <div class="outbound-queue-note">${item.note || "无备注"}</div>
                    </div>
                </div>
                <div class="outbound-queue-list">• ${listText.replace(/\n/g, "\n• ")}</div>
                <button class="inventory-text-button is-danger outbound-queue-delete" type="button">删除</button>
            </div>
        `;
        row.querySelector(".outbound-queue-delete").addEventListener("click", function () {
            window.outboundQueue = window.outboundQueue.filter(function (queueItem) {
                return String(queueItem.id) !== String(item.id);
            });
            window.renderOutboundQueue();
        });
        queueRoot.append(row);
    });
};

function addInventoryItemToOutboundQueue(item, showSuccess) {
    if (!item || !item.id) {
        Showbubble("项目ID不存在", "#d90000", "#ffffff");
        return false;
    }
    if (!window.isInventoryItemInStock(item)) {
        Showbubble("项目不在库，无法添加出库队列", "#d90000", "#ffffff");
        return false;
    }
    if (window.outboundQueue.some(function (queueItem) { return String(queueItem.id) === String(item.id); })) {
        Showbubble("项目已在出库队列中", "#d90000", "#ffffff");
        return false;
    }

    window.outboundQueue.push(item);
    window.renderOutboundQueue();
    if (showSuccess) {
        Showbubble("已添加到出库队列", "#32cd32", "#fff");
    }
    return true;
}

window.addItemToOutboundQueue = async function addItemToOutboundQueue(itemOrId, switchToOutboundPage = true) {
    var item = typeof itemOrId === "string" ? await window.fetchInventoryItemById(itemOrId) : itemOrId;
    if (!item) return null;

    var added = addInventoryItemToOutboundQueue(item, true);
    if (added && switchToOutboundPage) {
        window.showPage("outboundPage");
    }
    return added ? item : null;
};

window.handleAddOutboundItemById = async function handleAddOutboundItemById() {
    var itemId = document.getElementById("outboundQueryIdInput").value.trim();
    if (!itemId) {
        Showbubble("请填写项目ID", "#d90000", "#ffffff");
        return null;
    }

    var item = await window.fetchInventoryItemById(itemId, true);
    if (!item) return null;
    document.getElementById("outboundQueryIdInput").value = "";
    return addInventoryItemToOutboundQueue(item, true) ? item : null;
};

window.handleAddSelectedInventoryToOutboundQueue = async function handleAddSelectedInventoryToOutboundQueue() {
    var ids = window.getSelectedInventoryIds();
    var addedCount = 0;
    if (!ids.length) {
        Showbubble("请先选择库存项目", "#d90000", "#ffffff");
        return null;
    }

    for (var index = 0; index < ids.length; index += 1) {
        var item = await window.fetchInventoryItemById(ids[index]);
        if (item && addInventoryItemToOutboundQueue(item, false)) {
            addedCount += 1;
        }
    }

    if (addedCount > 0) {
        window.renderOutboundQueue();
        window.showPage("outboundPage");
        Showbubble("已添加 " + addedCount + " 个项目", "#32cd32", "#fff");
    }
    return addedCount;
};

window.handleSubmitOutboundReport = async function handleSubmitOutboundReport() {
    var submitButton = document.getElementById("outboundSubmitButton");
    var username = document.getElementById("outboundUsernameInput").value.trim();
    var tel = document.getElementById("outboundTelInput").value.trim();
    var endDate = document.getElementById("outboundEndDateInput").value;
    var note = document.getElementById("outboundNoteInput").value.trim();

    if (!window.outboundQueue.length || !username || !tel || !endDate) {
        Showbubble(!window.outboundQueue.length ? "请先添加出库项目" : "请完整填写姓名、电话号码和截止日期", "#d90000", "#ffffff");
        return null;
    }

    /*
    const attachmentCount = await window.loadOutboundUploadFileCount();
    if (attachmentCount <= 0) {
        Showbubble("请先上传附件", "#d90000", "#ffffff");
        return null;
    }
    */

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>提交中</span>';
    try {
        const result = await postApi(`${window.url}/api/order/addA`, {
            username: username,
            tel: tel,
            goods: window.outboundQueue.map(function (item) { return item.id; }),
            start_time: Date.now(),
            end_time: endDate,
            note: note || ""
        });
        if (!result.result) {
            await openModal("警告", result.msg || "提交失败");
            return null;
        }

        window.outboundQueue = [];
        document.getElementById("outboundUsernameInput").value = "";
        document.getElementById("outboundTelInput").value = "";
        document.getElementById("outboundEndDateInput").value = "";
        document.getElementById("outboundNoteInput").value = "";
        window.renderOutboundQueue();
        await window.loadInventoryData();
        Showbubble(result.msg || "出库提交成功", "#32cd32", "#fff");
        return result;
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = "<span>提交出库</span>";
    }
};

window.renderInboundQueue = function renderInboundQueue() {
    var queueRoot = document.getElementById("inboundQueueList");
    if (!queueRoot) return;
    queueRoot.innerHTML = "";
    if (!window.inboundQueue.length) {
        var empty = document.createElement("div");
        empty.className = "outbound-empty";
        empty.textContent = "暂无入库项目";
        queueRoot.append(empty);
        return;
    }

    window.inboundQueue.forEach(function (item) {
        var itemId = typeof item === "object" && item !== null ? item.id : item;
        var row = document.createElement("div");
        var listText = typeof item === "object" && item !== null ? window.getInventoryListText(item.list) : "";
        row.className = "outbound-queue-item";
        row.innerHTML = `
            <div class="outbound-queue-id">${itemId || ""}</div>
            <div class="outbound-queue-grid inbound-queue-grid">
                <div class="outbound-queue-main">
                    <img class="outbound-queue-thumbnail" src="${window.getInventoryThumbnailUrl(item && item.thumbnail)}" alt="${item && item.name ? item.name : itemId}">
                    <div class="outbound-queue-info">
                        <div class="outbound-queue-name">${item && item.name ? item.name : "订单项目"}</div>
                        <div class="outbound-queue-note">${item && item.note ? item.note : "无备注"}</div>
                    </div>
                </div>
                <div class="outbound-queue-list">${listText ? "• " + listText.replace(/\n/g, "\n• ") : "无清单信息"}</div>
            </div>
        `;
        queueRoot.append(row);
    });
};

function resetInboundOrderView() {
    window.currentInboundReport = null;
    window.inboundQueue = [];
    document.getElementById("inboundOrderIdText").textContent = "-";
    document.getElementById("inboundUsernameText").textContent = "-";
    document.getElementById("inboundTelText").textContent = "-";
    document.getElementById("inboundStartDateText").textContent = "-";
    document.getElementById("inboundEndDateText").textContent = "-";
    document.getElementById("inboundStatusText").textContent = "-";
    window.renderInboundQueue();
}

function fillInboundOrderView(report) {
    window.currentInboundReport = report;
    window.inboundQueue = parseOutboundGoodsList(report.goods);
    var statusInfo = window.getOutboundReportStatus(report);
    document.getElementById("inboundOrderIdText").textContent = report.id || "-";
    document.getElementById("inboundUsernameText").textContent = report.username || "-";
    document.getElementById("inboundTelText").textContent = report.tel || "-";
    document.getElementById("inboundStartDateText").textContent = report.start_time || "-";
    document.getElementById("inboundEndDateText").textContent = report.endTime || report.end_time || "-";
    document.getElementById("inboundStatusText").textContent = statusInfo.text;
    window.renderInboundQueue();
}

async function hydrateInboundQueueItems() {
    if (!window.inboundQueue.length) return [];

    var hydratedItems = [];
    for (var index = 0; index < window.inboundQueue.length; index += 1) {
        var item = window.inboundQueue[index];
        if (typeof item === "object" && item !== null) {
            hydratedItems.push(item);
            continue;
        }
        var fetchedItem = await window.fetchInventoryItemById(item, true);
        hydratedItems.push(fetchedItem || item);
    }

    window.inboundQueue = hydratedItems;
    window.renderInboundQueue();
    return hydratedItems;
}

window.openInboundPageWithOrder = async function openInboundPageWithOrder(orderId) {
    if (!orderId) {
        Showbubble("订单ID不存在", "#d90000", "#ffffff");
        return null;
    }

    window.showPage("inboundPage");
    document.getElementById("inboundQueryOrderIdInput").value = orderId;
    await window.loadInboundUploadFileCount();
    return window.handleQueryInboundOrder();
};

window.handleQueryInboundOrder = async function handleQueryInboundOrder() {
    var orderId = document.getElementById("inboundQueryOrderIdInput").value.trim();
    if (!orderId) {
        Showbubble("请填写订单ID", "#d90000", "#ffffff");
        return null;
    }

    var report = await window.fetchOutboundReportById(orderId);
    if (!report) {
        resetInboundOrderView();
        Showbubble("订单不存在", "#d90000", "#ffffff");
        return null;
    }

    if (Number(report.status) === 1) {
        Showbubble("订单已完结", "#d90000", "#ffffff");
    }
    fillInboundOrderView(report);
    await hydrateInboundQueueItems();
    Showbubble("查询成功", "#32cd32", "#fff");
    return report;
};

window.handleFinishInboundReport = async function handleFinishInboundReport() {
    var report = window.currentInboundReport;
    var finishButton = document.getElementById("inboundFinishButton");
    var note = document.getElementById("inboundNoteInput").value.trim();

    if (!report || !report.id) {
        Showbubble("请先查询订单", "#d90000", "#ffffff");
        return null;
    }

    var confirmed = await openModal("确认完结", "是否完结订单 " + report.id + "？");
    if (!confirmed) {
        return null;
    }
    
    /*
    const attachmentCount = await window.loadOutboundUploadFileCount();
    if (attachmentCount <= 0) {
        Showbubble("请先上传附件", "#d90000", "#ffffff");
        return null;
    }
    */

    finishButton.disabled = true;
    finishButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>完结中</span>';
    try {
        const result = await postApi(`${window.url}/api/order/finish_order`, {
            id: report.id,
            token: window.token,
            note: note
        });
        if (!result.result) {
            await openModal("警告", result.msg || "完结失败");
            return null;
        }

        document.getElementById("inboundNoteInput").value = "";
        Showbubble(result.msg || "订单已完结", "#32cd32", "#fff");
        await window.loadOutboundReportData();
        await window.loadInventoryData();
        var refreshed = findOutboundReportById(report.id);
        if (refreshed) {
            fillInboundOrderView(refreshed);
            await hydrateInboundQueueItems();
        }
        document.getElementById("inboundQueueList").innerHTML = "";
        return result;
    } finally {
        finishButton.disabled = false;
        finishButton.innerHTML = "<span>完结订单</span>";
    }
};
