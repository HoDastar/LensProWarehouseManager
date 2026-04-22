function parseDateOnly(dateText) {
    if (!dateText) return null;
    var date = new Date(String(dateText) + "T00:00:00");
    return Number.isNaN(date.getTime()) ? null : date;
}

function parseOutboundGoodsCount(goods) {
    if (Array.isArray(goods)) return goods.length;
    if (typeof goods !== "string" || !goods.trim()) return 0;
    try {
        var parsed = JSON.parse(goods);
        return Array.isArray(parsed) ? parsed.length : 0;
    } catch (error) {
        return goods.split(",").filter(function (item) { return item.trim(); }).length;
    }
}

window.getOutboundReportStatus = function getOutboundReportStatus(report) {
    if (Number(report.status) === 1) return { text: "已完结", className: "is-finished", remainingDays: 0 };
    var endDate = parseDateOnly(report.endTime);
    if (!endDate) return { text: "进行中", className: "is-processing", remainingDays: 0 };
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diffDays = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
    if (diffDays <= 0) return { text: "已到期", className: "is-expired", remainingDays: diffDays };
    if (diffDays <= 3) return { text: "即将到期", className: "is-due-soon", remainingDays: diffDays };
    return { text: "进行中", className: "is-processing", remainingDays: diffDays };
};

window.fetchOutboundReportData = async function fetchOutboundReportData() {
    const result = await getApi(`${window.url}/api/order/get_outbound_report_list`);
    if (result && result.result === false) {
        Showbubble(result.msg || "出库列表加载失败", "#d90000", "#ffffff");
        window.outboundReportAllData = [];
        return window.outboundReportAllData;
    }
    const listData = window.normalizeApiData(result, []);
    window.outboundReportAllData = Array.isArray(listData) ? listData : [];
    return window.outboundReportAllData;
};

function renderOutboundReportTable(items) {
    var body = document.getElementById("outboundReportTableBody");
    body.innerHTML = "";
    if (!items.length) {
        var emptyRow = document.createElement("tr");
        emptyRow.innerHTML = '<td colspan="8" class="outbound-report-empty">暂无出库订单</td>';
        body.append(emptyRow);
        return;
    }

    items.forEach(function (report) {
        var row = document.createElement("tr");
        var statusInfo = window.getOutboundReportStatus(report);
        var isFinished = Number(report.status) === 1;
        row.innerHTML = `
            <td>${report.id || ""}</td>
            <td><div class="outbound-report-user"><span>${report.username || ""}</span><span>${report.tel || ""}</span></div></td>
            <td>${parseOutboundGoodsCount(report.goods)}</td>
            <td>${statusInfo.remainingDays}</td>
            <td>${report.note || ""}</td>
            <td><span class="outbound-report-status ${statusInfo.className}">${statusInfo.text}</span></td>
            <td><div class="inventory-action-group"><button class="inventory-text-button outbound-finish-button" type="button"${isFinished ? " disabled" : ""}>完结</button><button class="inventory-text-button outbound-report-button" type="button">报告</button><button class="inventory-text-button outbound-attachment-button" type="button">附件</button></div></td>
        `;

        row.querySelector(".outbound-finish-button").addEventListener("click", function () {
            window.openInboundPageWithOrder(report.id);
        });
        row.querySelector(".outbound-report-button").addEventListener("click", async function () {
            const result = await window.warehouseBrowser.openLink(`${window.url}/outbound_report.html?id=${encodeURIComponent(report.id)}`);
            if (!result.ok) Showbubble(result.message || "打开出库报告失败", "#d90000", "#ffffff");
        });
        row.querySelector(".outbound-attachment-button").addEventListener("click", async function () {
            const result = await window.warehouseBrowser.openLink(`${window.url}/view_attachment.html?id=${encodeURIComponent(report.id)}`);
            if (!result.ok) Showbubble(result.message || "打开附件失败", "#d90000", "#ffffff");
        });
        body.append(row);
    });
}

function renderOutboundReportPagination() {
    var state = window.outboundReportPageState;
    var pagination = document.getElementById("outboundReportPagination");
    var totalPages = Math.max(1, Math.ceil(state.total / state.size));
    pagination.innerHTML = "";
    var totalText = document.createElement("span");
    totalText.className = "inventory-total-text";
    totalText.textContent = "共 " + state.total + " 条";
    pagination.append(totalText);

    var prevButton = document.createElement("button");
    prevButton.className = "pagination-button";
    prevButton.type = "button";
    prevButton.textContent = "<";
    prevButton.disabled = state.page === 0;
    prevButton.addEventListener("click", function () { if (state.page > 0) { state.page -= 1; window.loadOutboundReportData(); } });
    pagination.append(prevButton);

    for (var index = 0; index < totalPages; index += 1) {
        var pageButton = document.createElement("button");
        pageButton.className = "pagination-button" + (index === state.page ? " is-active" : "");
        pageButton.type = "button";
        pageButton.textContent = index + 1;
        pageButton.dataset.page = index;
        pageButton.addEventListener("click", function (event) {
            state.page = Number(event.currentTarget.dataset.page);
            window.loadOutboundReportData();
        });
        pagination.append(pageButton);
    }

    var nextButton = document.createElement("button");
    nextButton.className = "pagination-button";
    nextButton.type = "button";
    nextButton.textContent = ">";
    nextButton.disabled = state.page >= totalPages - 1;
    nextButton.addEventListener("click", function () { if (state.page < totalPages - 1) { state.page += 1; window.loadOutboundReportData(); } });
    pagination.append(nextButton);
}

function renderOutboundReportSizes() {
    var sizeGroup = document.getElementById("outboundReportSizeGroup");
    sizeGroup.innerHTML = "";
    var select = document.createElement("select");
    select.className = "inventory-size-select";
    [10, 20, 50].forEach(function (size) {
        var option = document.createElement("option");
        option.value = size;
        option.textContent = size + " 条/页";
        option.selected = window.outboundReportPageState.size === size;
        select.append(option);
    });
    select.addEventListener("change", function (event) {
        window.outboundReportPageState.size = Number(event.target.value);
        window.outboundReportPageState.page = 0;
        window.loadOutboundReportData();
    });
    sizeGroup.append(select);
}

window.loadOutboundReportData = async function loadOutboundReportData() {
    var allItems = await window.fetchOutboundReportData();
    window.outboundReportPageState.total = allItems.length;

    var totalPages = Math.max(1, Math.ceil(window.outboundReportPageState.total / window.outboundReportPageState.size));
    if (window.outboundReportPageState.page >= totalPages) {
        window.outboundReportPageState.page = totalPages - 1;
    }

    var start = window.outboundReportPageState.page * window.outboundReportPageState.size;
    var pageItems = allItems.slice(start, start + window.outboundReportPageState.size);
    renderOutboundReportTable(pageItems);
    renderOutboundReportPagination();
    renderOutboundReportSizes();
};
