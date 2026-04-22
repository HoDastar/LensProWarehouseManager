window.loadInventoryFilters = async function loadInventoryFilters(forceReload = false) {
    if (window.inventoryFilterLoaded && !forceReload) {
        return window.inventoryTagGroups;
    }

    const result = await getApi(`${window.url}/api/config/get_filter`);
    if (result && result.result === false) {
        Showbubble(result.msg || "筛选器加载失败", "#d90000", "#ffffff");
        window.inventoryTagGroups = {};
        window.inventoryFilterLoaded = true;
        return window.inventoryTagGroups;
    }

    const filterData = window.normalizeApiData(result, {});
    window.inventoryTagGroups = filterData && typeof filterData === "object" && !Array.isArray(filterData) ? filterData : {};
    window.inventoryFilterLoaded = true;
    return window.inventoryTagGroups;
};

window.fetchInventoryData = async function fetchInventoryData(tags = []) {
    const params = new URLSearchParams();
    params.set("tags", JSON.stringify(Array.isArray(tags) ? tags : []));
    if (window.inventoryPageState.selectedStatus !== "") {
        params.set("status", window.inventoryPageState.selectedStatus);
    }
    if (window.inventoryPageState.searchName) {
        params.set("name", window.inventoryPageState.searchName);
    }

    const result = await getApi(`${window.url}/api/warehouse/get_list?${params.toString()}`);
    if (result && result.result === false) {
        Showbubble(result.msg || "库存数据加载失败", "#d90000", "#ffffff");
        window.inventoryAllData = [];
        return window.inventoryAllData;
    }

    const listData = window.normalizeApiData(result, []);
    window.inventoryAllData = Array.isArray(listData) ? listData : [];
    return window.inventoryAllData;
};

function renderInventoryFilters() {
    var filterRoot = document.getElementById("inventoryTagFilter");
    filterRoot.innerHTML = "";
    var state = window.inventoryPageState;

    var statusRow = document.createElement("div");
    statusRow.className = "inventory-filter-row";
    var statusTitle = document.createElement("div");
    statusTitle.className = "inventory-filter-title";
    statusTitle.textContent = "状态";
    var statusWrap = document.createElement("div");
    statusWrap.className = "inventory-filter-tags";

    [{ text: "全部", value: "" }, { text: "在库中", value: "0" }, { text: "已出库", value: "1" }].forEach(function (option) {
        var button = document.createElement("button");
        button.className = "inventory-tag-option" + (state.selectedStatus === option.value ? " is-active" : "");
        button.type = "button";
        button.textContent = option.text;
        button.addEventListener("click", function () {
            state.selectedStatus = option.value;
            state.page = 0;
            state.size = 10;
            window.loadInventoryData();
        });
        statusWrap.append(button);
    });

    statusRow.append(statusTitle, statusWrap);
    filterRoot.append(statusRow);

    Object.keys(window.inventoryTagGroups).forEach(function (groupName) {
        var groupTags = Array.isArray(window.inventoryTagGroups[groupName]) ? window.inventoryTagGroups[groupName] : [];
        var hasGroupSelected = groupTags.some(function (tag) { return state.selectedTags.indexOf(tag) !== -1; });
        var row = document.createElement("div");
        row.className = "inventory-filter-row";
        var title = document.createElement("div");
        title.className = "inventory-filter-title";
        title.textContent = groupName;
        var tagWrap = document.createElement("div");
        tagWrap.className = "inventory-filter-tags";

        var allButton = document.createElement("button");
        allButton.className = "inventory-tag-option" + (hasGroupSelected ? "" : " is-active");
        allButton.type = "button";
        allButton.textContent = "全部";
        allButton.addEventListener("click", function () {
            state.selectedTags = state.selectedTags.filter(function (selectedTag) { return groupTags.indexOf(selectedTag) === -1; });
            state.page = 0;
            state.size = 10;
            window.loadInventoryData();
        });
        tagWrap.append(allButton);

        groupTags.forEach(function (tag) {
            var button = document.createElement("button");
            button.className = "inventory-tag-option";
            button.type = "button";
            button.textContent = tag;
            if (state.selectedTags.indexOf(tag) !== -1) {
                button.classList.add("is-active");
            }
            button.addEventListener("click", function () {
                state.selectedTags = state.selectedTags.filter(function (selectedTag) { return groupTags.indexOf(selectedTag) === -1; });
                state.selectedTags.push(tag);
                state.page = 0;
                state.size = 10;
                window.loadInventoryData();
            });
            tagWrap.append(button);
        });

        row.append(title, tagWrap);
        filterRoot.append(row);
    });
}

function renderInventoryTable(items) {
    var body = document.getElementById("inventoryTableBody");
    body.innerHTML = "";

    items.forEach(function (item) {
        var row = document.createElement("tr");
        var listText = window.getInventoryListText(item.list);
        var tags = Array.isArray(item.tags) ? item.tags : [];
        var inStock = window.isInventoryItemInStock(item);
        row.innerHTML = `
            <td><label class="check-box"><input class="inventory-row-checkbox" type="checkbox" value="${item.id}"><span class="check-box-mark"></span></label></td>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td><img class="inventory-thumbnail" src="${window.getInventoryThumbnailUrl(item.thumbnail)}" alt="${item.name}"></td>
            <td><div class="inventory-list-cell">• ${listText.replace(/\n/g, "\n• ")}</div></td>
            <td><div class="inventory-tag-list">${tags.map(function (tag) { return `<span class="inventory-tag-badge">${tag}</span>`; }).join("")}</div></td>
            <td>${item.note || ""}</td>
            <td><span class="inventory-status ${inStock ? "is-in-stock" : "is-out-stock"}">${inStock ? "在库中" : "已出库"}</span></td>
            <td><div class="inventory-action-group"><button class="inventory-text-button inventory-modify-button" type="button">修改</button><button class="inventory-text-button is-danger inventory-delete-button" type="button">删除</button></div></td>
        `;
        row.querySelector(".inventory-modify-button").addEventListener("click", function () {
            window.handleModifyInventoryItem(item.id);
        });
        var deleteButton = row.querySelector(".inventory-delete-button");
        deleteButton.addEventListener("click", function () {
            window.handleDeleteInventoryItem(item.id, deleteButton);
        });
        body.append(row);
    });
}

function renderInventoryPagination() {
    var state = window.inventoryPageState;
    var pagination = document.getElementById("inventoryPagination");
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
    prevButton.addEventListener("click", function () { if (state.page > 0) { state.page -= 1; window.loadInventoryData(); } });
    pagination.append(prevButton);

    for (var index = 0; index < totalPages; index += 1) {
        var pageButton = document.createElement("button");
        pageButton.className = "pagination-button" + (index === state.page ? " is-active" : "");
        pageButton.type = "button";
        pageButton.textContent = index + 1;
        pageButton.dataset.page = index;
        pageButton.addEventListener("click", function (event) {
            state.page = Number(event.currentTarget.dataset.page);
            window.loadInventoryData();
        });
        pagination.append(pageButton);
    }

    var nextButton = document.createElement("button");
    nextButton.className = "pagination-button";
    nextButton.type = "button";
    nextButton.textContent = ">";
    nextButton.disabled = state.page >= totalPages - 1;
    nextButton.addEventListener("click", function () { if (state.page < totalPages - 1) { state.page += 1; window.loadInventoryData(); } });
    pagination.append(nextButton);
}

function renderInventorySizes() {
    var state = window.inventoryPageState;
    var sizeGroup = document.getElementById("inventorySizeGroup");
    sizeGroup.innerHTML = "";
    var select = document.createElement("select");
    select.className = "inventory-size-select";
    [10, 20, 50].forEach(function (size) {
        var option = document.createElement("option");
        option.value = size;
        option.textContent = size + " 条/页";
        option.selected = state.size === size;
        select.append(option);
    });
    select.addEventListener("change", function (event) {
        state.size = Number(event.target.value);
        state.page = 0;
        window.loadInventoryData();
    });
    sizeGroup.append(select);
}

window.getSelectedInventoryIds = function getSelectedInventoryIds() {
    return Array.from(document.querySelectorAll(".inventory-row-checkbox:checked")).map(function (checkbox) {
        return checkbox.value;
    });
};

window.loadInventoryData = async function loadInventoryData() {
    await window.loadInventoryFilters();
    renderInventoryFilters();

    var allItems = await window.fetchInventoryData(window.inventoryPageState.selectedTags);
    window.inventoryPageState.total = allItems.length;

    var totalPages = Math.max(1, Math.ceil(window.inventoryPageState.total / window.inventoryPageState.size));
    if (window.inventoryPageState.page >= totalPages) {
        window.inventoryPageState.page = totalPages - 1;
    }

    var start = window.inventoryPageState.page * window.inventoryPageState.size;
    var pageItems = allItems.slice(start, start + window.inventoryPageState.size);
    renderInventoryTable(pageItems);
    renderInventoryPagination();
    renderInventorySizes();
    document.getElementById("inventoryCheckAll").checked = false;
    window.renderOverviewData();
    await window.loadOverviewCurrentLogs();
};

window.fetchInventoryItemById = async function fetchInventoryItemById(itemId, forceFetch = false) {
    var cachedItem = window.inventoryAllData.find(function (item) {
        return String(item.id) === String(itemId);
    });
    if (cachedItem && !forceFetch) {
        return cachedItem;
    }

    const result = await getApi(`${window.url}/api/warehouse/get_item?id=${encodeURIComponent(itemId)}`);
    if (!result.result) {
        await openModal("警告", result.msg || "项目不存在");
        return null;
    }
    return result.data;
};

window.handleDeleteInventoryItem = async function handleDeleteInventoryItem(itemId, triggerButton) {
    if (!itemId) {
        Showbubble("项目ID不存在", "#d90000", "#ffffff");
        return null;
    }

    var confirmed = await openModal("确认删除", "是否删除项目 " + itemId + "？");
    if (!confirmed) {
        return null;
    }

    if (triggerButton) {
        triggerButton.disabled = true;
        triggerButton.textContent = "删除中";
    }

    try {
        const result = await postApi(`${window.url}/api/warehouse/delete`, { id: itemId, token: window.token });
        if (!result.result) {
            await openModal("警告", result.msg || "删除失败");
            return null;
        }
        Showbubble(result.msg || "删除成功", "#32cd32", "#fff");
        await window.loadInventoryData();
        return result;
    } finally {
        if (triggerButton) {
            triggerButton.disabled = false;
            triggerButton.textContent = "删除";
        }
    }
};
