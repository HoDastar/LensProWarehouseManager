async function getApi(url) {
  try {
    const response = await fetch(url, {
      method: "GET"
    });
    if (!response.ok) {
      console.log(`GET error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "msg": "处理请求时发生错误。"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`GET error: ${String(error)}`);
    return {
      "result": false,
      "msg": "处理请求时发生错误。"
    };
  }
}

async function postApi(url, param) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(param),
    });
    if (!response.ok) {
      console.log(`POST error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "msg": "处理请求时发生错误。"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`POST error: ${String(error)}`);
    return {
      "result": false,
      "msg": "处理请求时发生错误。"
    };
  }
}

async function postApiWithFile(url, param, file) {
  const formData = new FormData();
  if (file) {
        formData.append("file", file);
  }
  formData.append("json", JSON.stringify(param));
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      console.log(`POST error: ${response.status} ${response.statusText}`);
      return {
        "result": false,
        "msg": "处理请求时发生错误。"
      };
    }
    return await response.json();
  } catch (error) {
    console.log(`POST error: ${String(error)}`);
    return {
      "result": false,
      "msg": "处理请求时发生错误。"
    };
  }
}