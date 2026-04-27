window.inventoryTagGroups = {};
window.inventoryAllData = [];
window.inventoryFilterLoaded = false;
window.outboundReportAllData = [];
window.outboundQueue = [];
window.currentInboundReport = null;
window.inboundQueue = [];
window.currentModifyItemData = null;

window.url = "";
window.token = "";
window.appVersion = "";
window.appBuild = "";

window.inventoryPageState = {
    page: 0,
    size: 10,
    selectedTags: [],
    selectedStatus: "",
    searchName: "",
    total: 0
};

window.outboundReportPageState = {
    page: 0,
    size: 10,
    total: 0
};

window.initElectronConfig = async function initElectronConfig() {
    const config = await window.warehouseConfig.get();
    window.url = config.url || "";
    window.token = config.token || "";
    window.appVersion = config.version == null ? "" : String(config.version);
    window.appBuild = config.build == null ? "" : String(config.build);
    document.getElementById("aboutVersionText").textContent = window.appVersion || "-";
    document.getElementById("aboutBuildText").textContent = window.appBuild || "-";
};

window.normalizeApiData = function normalizeApiData(result, fallback) {
    if (Array.isArray(result)) {
        return result;
    }
    if (result && Object.prototype.hasOwnProperty.call(result, "data")) {
        return result.data;
    }
    return fallback;
};

window.loadAboutChangelog = async function loadAboutChangelog() {
    var listRoot = document.getElementById("aboutChangelogList");
    if (!listRoot) {
        return;
    }

    listRoot.innerHTML = "";
    const result = await getApi(window.url + "/api/config/get_changelog");
    if (result && result.result === false) {
        Showbubble(result.msg || "版本日志加载失败", "#d90000", "#ffffff");
        return;
    }

    var changelogList = window.normalizeApiData(result, []);
    if (!Array.isArray(changelogList) || !changelogList.length) {
        var emptyText = document.createElement("p");
        emptyText.className = "about-changelog-content";
        emptyText.textContent = "暂无版本日志";
        listRoot.append(emptyText);
        return;
    }

    changelogList.forEach(function (item) {
        var changelogItem = document.createElement("div");
        changelogItem.className = "about-changelog-item";

        var versionTitle = document.createElement("h3");
        versionTitle.className = "about-changelog-version";
        versionTitle.textContent = item.version || "-";

        var content = document.createElement("p");
        content.className = "about-changelog-content";
        content.textContent = String(item.content || "").replace(/\\n/g, "\n");

        changelogItem.append(versionTitle, content);
        listRoot.append(changelogItem);
    });
};

window.showPage = function showPage(pageId) {
    var toolbarButtons = document.querySelectorAll(".toolbar-button");
    var pageViews = document.querySelectorAll(".page-view");
    toolbarButtons.forEach(function (item) {
        item.classList.toggle("is-active", item.dataset.page === pageId);
    });
    pageViews.forEach(function (page) {
        page.classList.toggle("is-active", page.id === pageId);
    });
};

window.bindToolbarNavigation = function bindToolbarNavigation() {
    var toolbarButtons = document.querySelectorAll(".toolbar-button");
    toolbarButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            window.showPage(button.dataset.page);
            if (button.dataset.page === "outboundListPage") {
                window.loadOutboundReportData();
            }
            if (button.dataset.page === "outboundPage") {
                window.loadOutboundUploadFileCount();
            }
            if (button.dataset.page === "inboundPage") {
                window.loadInboundUploadFileCount();
            }
        });
    });
};

window.bindWindowControls = function bindWindowControls() {
    document.getElementById("windowMinimizeButton").addEventListener("click", function () {
        window.warehouseWindow.minimize();
    });
    document.getElementById("windowMaximizeButton").addEventListener("click", function () {
        window.warehouseWindow.maximize();
    });
    document.getElementById("windowCloseButton").addEventListener("click", function () {
        window.warehouseWindow.close();
    });
};

window.fileInputChange = function fileInputChange(id, allowed = ["jpg", "png", "jpeg", "webp"]) {
    const fileInput = document.getElementById(id);
    const file = fileInput.files[0];
    const fileName = file.name;
    const fileExt = fileName.split(".").pop().toLowerCase();
    if (!allowed.includes(fileExt)) {
        fileInput.value = "";
        return;
    }
    const imgExt = ["jpg", "png", "jpeg", "webp"];
    const display = document.getElementById(id + "Display");
    display.innerHTML = '';
    if (imgExt.includes(fileExt)) {
        const imgEl = document.createElement("img");
        imgEl.classList.add("input-file-img");
        display.appendChild(imgEl);
        const reader = new FileReader();
        reader.onload = (e) => {
            imgEl.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        const fileNameEl = document.createElement("span");
        fileNameEl.innerText = fileName;
        display.appendChild(fileNameEl);
    }
};

window.checkToken = async function checkToken() {
    const result = await getApi(window.url + "/api/config/check_token?token=" + window.token);
    if (!result.result) {
        await openModal("警告", "会话已过期，请退出然后重新访问。");
        document.getElementsByTagName("html")[0].innerHTML = '';
    } else {
        setTimeout(() => {
            window.checkToken();
        }, 5 * 60 * 1000);
    }
};

document.addEventListener("DOMContentLoaded", async function () {
    await window.initElectronConfig();
    window.bindWindowControls();
    window.bindToolbarNavigation();
    window.renderOverviewData();
    window.checkToken();
    window.loadInventoryData();
    window.loadOutboundReportData();
    window.loadAboutChangelog();

    document.getElementById("inventoryRefreshButton").addEventListener("click", function () {
        window.loadInventoryData();
    });
    document.getElementById("outboundReportRefreshButton").addEventListener("click", function () {
        window.loadOutboundReportData();
    });
    document.getElementById("outboundUploadOpenButton").addEventListener("click", async function () {
        await window.openUploadPage();
    });
    document.getElementById("outboundUploadRefreshButton").addEventListener("click", async function () {
        await window.loadOutboundUploadFileCount();
    });
    document.getElementById("inboundUploadOpenButton").addEventListener("click", async function () {
        await window.openUploadPage();
    });
    document.getElementById("inboundUploadRefreshButton").addEventListener("click", async function () {
        await window.loadInboundUploadFileCount();
    });
    document.getElementById("inboundQuerySubmitButton").addEventListener("click", async function () {
        await window.handleQueryInboundOrder();
    });
    document.getElementById("inboundFinishButton").addEventListener("click", async function () {
        await window.handleFinishInboundReport();
    });
    document.getElementById("inventoryAddOutboundButton").addEventListener("click", async function () {
        await window.handleAddSelectedInventoryToOutboundQueue();
    });
    document.getElementById("passwordSubmitButton").addEventListener("click", async function () {
        await window.handleAlterPassword();
    });
    document.getElementById("inventoryCheckAll").addEventListener("change", function (event) {
        document.querySelectorAll(".inventory-row-checkbox").forEach(function (checkbox) {
            checkbox.checked = event.target.checked;
        });
    });
    document.getElementById("addPhotoInput").addEventListener("change", function () {
        window.fileInputChange("addPhotoInput");
    });
    document.getElementById("addInventorySubmitButton").addEventListener("click", async function () {
        await window.handleAddInventoryFormData();
    });
    document.getElementById("cleanInventorySubmitButton").addEventListener("click", function () {
        window.handleCleanInventoryFormData();
    });
    document.getElementById("cleanModifyInfo").addEventListener("click", function () {
        window.handlecleanModifyInfo();
    });
    document.getElementById("modifyPhotoInput").addEventListener("change", function () {
        window.fileInputChange("modifyPhotoInput");
    });
    document.getElementById("modifyQuerySubmitButton").addEventListener("click", async function () {
        await window.handleQueryModifyItem();
    });
    document.getElementById("modifyStatusSubmitButton").addEventListener("click", async function () {
        await window.handleUpdateModifyStatus();
    });
    document.getElementById("modifyInfoSubmitButton").addEventListener("click", async function () {
        await window.handleUpdateModifyInfo();
    });
    document.getElementById("outboundQuerySubmitButton").addEventListener("click", async function () {
        await window.handleAddOutboundItemById();
    });
    document.getElementById("outboundSubmitButton").addEventListener("click", async function () {
        await window.handleSubmitOutboundReport();
        await window.loadOutboundReportData();
    });
    document.getElementById("outboundClearButton").addEventListener("click", function () {
        window.outboundQueue = [];
        window.renderOutboundQueue();
    });

    window.renderOutboundQueue();
    window.renderInboundQueue();
    window.loadOutboundUploadFileCount();
    window.loadInboundUploadFileCount();

    /*
    document.querySelectorAll(".bordered-table-wrap").forEach(function (wrap) {
        wrap.addEventListener("wheel", function (event) {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }
            event.preventDefault();
            wrap.scrollLeft += event.deltaY;
        }, { passive: false });
    });
    */
});
