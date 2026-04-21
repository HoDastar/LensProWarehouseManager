package com.reclight.warehouseserver.controllers;

import com.reclight.warehouseserver.mappers.CheckToken;
import com.reclight.warehouseserver.mappers.ConfigMapper;
import com.reclight.warehouseserver.util.CryptUtil;
import com.reclight.warehouseserver.util.FileUtil;
import com.reclight.warehouseserver.util.Respond;
import com.reclight.warehouseserver.util.Utilities;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigAPI {
    @Autowired
    public ConfigMapper configMapper;

    // 验证访问密码
    @GetMapping("/check_password")
    public Respond<String> checkPassword(@RequestParam("password") String password) {
        String correctPassword = configMapper.getConfigById(0);
        if (!CryptUtil.checkBCEcrypt(password, correctPassword)) {
            return new Respond<>(false, "密码错误", null);
        }
        // 生成token
        String token = CryptUtil.NBEncrypt(Utilities.generateUUID());
        // 存储token
        String sessionToken = CryptUtil.NBEncrypt(token);
        String dir = System.getProperty("user.dir") + File.separator + "loginSession" + File.separator;
        FileUtil.saveDocumentFile(sessionToken, dir, "login.session");
        return new Respond<>(true, "密码正确", token);
    }

    // 修改访问密码
    @PostMapping("/alter_password")
    public Respond<String> alterPassword(
            @RequestBody HashMap<String, Object> body
    ) {
        if (!body.containsKey("password") || !body.containsKey("newPassword")) {
            return new Respond<>(false, "参数错误", null);
        }
        if (!(body.get("password") instanceof String) || !(body.get("newPassword") instanceof String)) {
            return new Respond<>(false, "参数类型错误", null);
        }

        String password = body.get("password").toString();
        String newPassword = body.get("newPassword").toString();

        String correctPassword = configMapper.getConfigById(0);
        if (!CryptUtil.checkBCEcrypt(password, correctPassword)) {
            return new Respond<>(false, "密码错误", null);
        }

        // 修改
        int rowsAffected = configMapper.updateConfigById(
                CryptUtil.BCEcrypt(newPassword),
                0
        );
        if (rowsAffected == 0) {
            return new Respond<>(false, "修改失败，请类型管理员", null);
        }
        return new Respond<>(true, "修改成功", null);
    }

    // 验证token
    @GetMapping("/check_token")
    public Respond<String> checkToken(@RequestParam("token") String token) {
        Boolean result = CheckToken.checkToken(token);
        if (!result) {
            return new Respond<>(false, "token无效", null);
        }
        return new Respond<>(true, "token有效", null);
    }

    @GetMapping("/check_password_web")
    public Respond<String> checkPasswordWeb(@RequestParam("password") String password) {
        String correctPassword = configMapper.getConfigById(0);
        if (!CryptUtil.checkBCEcrypt(password, correctPassword)) {
            return new Respond<>(false, "密码错误", null);
        }
        // 生成token
        String token = CryptUtil.NBEncrypt(Utilities.generateUUID());
        // 存储token
        String sessionToken = CryptUtil.NBEncrypt(token);
        String dir = System.getProperty("user.dir") + File.separator + "loginSession" + File.separator;
        FileUtil.saveDocumentFile(sessionToken, dir, "loginWeb.session");
        return new Respond<>(true, "密码正确", token);
    }

    @GetMapping("/check_token_web")
    public  Respond<String> checkTokenWeb(@RequestParam("token") String token) {
        Boolean result = CheckToken.checkTokenWeb(token);
        if (!result) {
            return new Respond<>(false, "token无效", null);
        }
        return new Respond<>(true, "token有效", null);
    }

    // 获取filter
    @GetMapping("/get_filter")
    public Respond<Map<String, Object>> getFilter() {
        String filterStr = configMapper.getConfigById(1);
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> data = mapper.readValue(filterStr, Map.class);
        return new Respond<>(true, "true", data);
    }

    // 查询版本
    @GetMapping("/get_version")
    public Respond<Integer> getVersion() {
        String value = configMapper.getConfigById(2);
        int build = Integer.parseInt(value);
        return new Respond<>(true, "true", build);
    }
}
