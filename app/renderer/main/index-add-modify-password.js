window.handleCleanInventoryFormData = function handleCleanInventoryFormData() {
    document.getElementById("addItemNameInput").value = "";
    document.getElementById("addPhotoInput").value = "";
    document.getElementById("addItemListInput").value = "";
    document.getElementById("addItemTagsInput").value = "";
    document.getElementById("addItemNoteInput").value = "";
    document.getElementById("addPhotoInputDisplay").innerHTML = "请上传文件";
};

function setAddInventorySubmitLoading(isLoading) {
    var submitButton = document.getElementById("addInventorySubmitButton");
    submitButton.disabled = isLoading;
    submitButton.innerHTML = isLoading
        ? '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>提交中</span>'
        : '<span>提交</span>';
}

window.handleAddInventoryFormData = async function handleAddInventoryFormData() {
    var submitButton = document.getElementById("addInventorySubmitButton");
    if (submitButton.disabled) {
        return null;
    }

    var itemName = document.getElementById("addItemNameInput").value.trim();
    var photoFile = document.getElementById("addPhotoInput").files[0];
    var itemListRaw = document.getElementById("addItemListInput").value.trim();
    var itemTagsRaw = document.getElementById("addItemTagsInput").value.trim();
    var itemNote = document.getElementById("addItemNoteInput").value.trim();
    var itemList = itemListRaw.split(/\|/).map(function (item) { return item.trim(); }).filter(Boolean);
    var itemTags = itemTagsRaw.split(/\|/).map(function (item) { return item.trim(); }).filter(Boolean);

    if (!itemName || !itemList.length || !itemTags.length) {
        Showbubble("请完整填写项目、配件和标签", "#d90000", "#ffffff");
        return null;
    }

    var formData = { token: window.token, name: itemName, list: itemList, tags: itemTags, note: itemNote };
    setAddInventorySubmitLoading(true);
    try {
        const result = await postApiWithFile(window.url + "/api/warehouse/add", formData, photoFile);
        if (!result.result) {
            await openModal("警告", result.msg);
            return;
        }
        window.handleCleanInventoryFormData();
        Showbubble("提交成功", "#32cd32", "#fff");
        window.loadInventoryData();
    } finally {
        setAddInventorySubmitLoading(false);
    }
};

function collectInventoryFormData(prefix, requireId) {
    var itemId = requireId ? document.getElementById("modifyQueryIdInput").value.trim() : "";
    var itemName = document.getElementById(prefix + "ItemNameInput").value.trim();
    var photoFile = document.getElementById(prefix + "PhotoInput").files[0];
    var itemList = document.getElementById(prefix + "ItemListInput").value.trim().split(/\|/).map(function (item) { return item.trim(); }).filter(Boolean);
    var itemTags = document.getElementById(prefix + "ItemTagsInput").value.trim().split(/\|/).map(function (item) { return item.trim(); }).filter(Boolean);
    var itemNote = document.getElementById(prefix + "ItemNoteInput").value.trim();

    if (requireId && !itemId) {
        Showbubble("请先填写项目ID", "#d90000", "#ffffff");
        return null;
    }
    if (!itemName || !itemList.length || !itemTags.length) {
        Showbubble("请完整填写项目、配件和标签", "#d90000", "#ffffff");
        return null;
    }

    var formData = { token: window.token, name: itemName, list: itemList, tags: itemTags, note: itemNote };
    if (requireId) {
        formData.id = itemId;
    }
    return { data: formData, file: photoFile };
}

function loadModifyItemData(itemData) {
    window.currentModifyItemData = itemData;
    document.getElementById("modifyItemNameInput").value = itemData.name || "";
    document.getElementById("modifyItemListInput").value = Array.isArray(itemData.list) ? itemData.list.join(" | ") : "";
    document.getElementById("modifyItemTagsInput").value = Array.isArray(itemData.tags) ? itemData.tags.join(" | ") : "";
    document.getElementById("modifyItemNoteInput").value = itemData.note || "";
    document.getElementById(itemData.status ? "modifyStatusOutRadio" : "modifyStatusInRadio").checked = true;
    var display = document.getElementById("modifyPhotoInputDisplay");
    display.innerHTML = itemData.thumbnail
        ? `<img class="input-file-img" src="${window.url}${itemData.thumbnail}" alt="${itemData.name || '项目缩略图'}">`
        : "请上传文件";
}

window.handleQueryModifyItem = async function handleQueryModifyItem() {
    var itemId = document.getElementById("modifyQueryIdInput").value.trim();
    if (!itemId) {
        Showbubble("请填写项目ID", "#d90000", "#ffffff");
        return null;
    }

    const result = await getApi(`${window.url}/api/warehouse/get_item?id=${encodeURIComponent(itemId)}`);
    if (!result.result) {
        await openModal("警告", result.msg || "查询失败");
        return null;
    }

    loadModifyItemData(result.data);
    Showbubble(result.msg || "查询成功", "#32cd32", "#fff");
    return result.data;
};

window.handleUpdateModifyStatus = async function handleUpdateModifyStatus() {
    var itemId = document.getElementById("modifyQueryIdInput").value.trim();
    var checkedStatus = document.querySelector("input[name='modifyStatusRadio']:checked");
    if (!itemId || !checkedStatus) {
        Showbubble(!itemId ? "请先填写项目ID" : "请选择入库或出库", "#d90000", "#ffffff");
        return null;
    }

    const result = await postApi(`${window.url}/api/warehouse/update_status`, {
        id: itemId,
        status: Number(checkedStatus.value),
        token: window.token
    });
    if (!result.result) {
        await openModal("警告", result.msg || "修改失败");
        return null;
    }

    Showbubble(result.msg || "状态修改成功", "#32cd32", "#fff");
    window.loadInventoryData();
    return result;
};

window.handleUpdateModifyInfo = async function handleUpdateModifyInfo() {
    var collected = collectInventoryFormData("modify", true);
    if (!collected) {
        return null;
    }

    const result = await postApiWithFile(`${window.url}/api/warehouse/update`, collected.data, collected.file);
    if (!result.result) {
        await openModal("警告", result.msg || "修改失败");
        return null;
    }

    Showbubble(result.msg || "信息修改成功", "#32cd32", "#fff");
    window.loadInventoryData();
    return result;
};

window.handleModifyInventoryItem = async function handleModifyInventoryItem(itemId) {
    if (!itemId) {
        Showbubble("项目ID不存在", "#d90000", "#ffffff");
        return null;
    }

    document.getElementById("modifyQueryIdInput").value = itemId;
    window.showPage("modifyPage");
    return await window.handleQueryModifyItem();
};

window.handleAlterPassword = async function handleAlterPassword() {
    var submitButton = document.getElementById("passwordSubmitButton");
    var password = document.getElementById("oldPasswordInput").value.trim();
    var newPassword = document.getElementById("newPasswordInput").value.trim();
    var confirmPassword = document.getElementById("confirmPasswordInput").value.trim();

    if (!password || !newPassword || !confirmPassword) {
        Showbubble("请完整填写密码", "#d90000", "#ffffff");
        return null;
    }
    if (newPassword !== confirmPassword) {
        Showbubble("两次输入的新密码不一致", "#d90000", "#ffffff");
        return null;
    }

    submitButton.disabled = true;
    submitButton.textContent = "提交中";
    try {
        const result = await postApi(`${window.url}/api/config/alter_password`, { password: password, newPassword: newPassword });
        if (!result.result) {
            await openModal("警告", result.msg || "修改失败");
            return null;
        }
        await openModal("修改成功", result.msg || "访问密码已修改，应用将重启。");
        window.warehouseWindow.restart();
        return result;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "提交修改";
    }
};
