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
