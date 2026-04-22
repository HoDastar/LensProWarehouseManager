package com.reclight.warehouseserver.controllers;

import com.reclight.warehouseserver.mappers.AttachmentMapper;
import com.reclight.warehouseserver.mappers.CheckToken;
import com.reclight.warehouseserver.mappers.PhotoPool;
import com.reclight.warehouseserver.util.FileUtil;
import com.reclight.warehouseserver.util.Respond;
import com.reclight.warehouseserver.util.Utilities;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attachment")
public class AttachmentAPI {
    @Autowired
    public AttachmentMapper attachmentMapper;

    @PostMapping("/upload")
    public Respond<String> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("token") String token
    ) {
        // 验证权限
        if (!CheckToken.checkTokenWeb(token)) {
            return new Respond<>(false, "token无效", null);
        }

        String extension = FileUtil.getFileExtension(file.getOriginalFilename());
        String day = Utilities.getNowYMDNumber();
        // 检查文件格式
        if (!FileUtil.isValidImg(extension)) {
            return new Respond<>(false, "文件格式错误", null);
        }
        // 检查文件大小（限制在50MB）
        if (file.getSize() > 50 * 1024 * 1024) {
            return new Respond<>(false, "文件大小超过限制", null);
        }
        String filename = Utilities.generateUUID() + "." + extension;
        String dirStr = "/data/uploads/attachment/" + day + "/";
        FileUtil.saveMultipartFile(file, System.getProperty("user.dir") + dirStr, filename);

        PhotoPool.getInstance().setData(dirStr + filename);
        return new Respond<>(true, "上传成功", null);
    }

    // 查询附件
    @GetMapping("/get_photos")
    public Respond<List<String>> getPhotos() {
        return new Respond<>(true, "获取成功", PhotoPool.getInstance().getData());
    }

    // 清空附件
    @PostMapping("/clean")
    public Respond<String> clean(
            @RequestBody HashMap<String, Object> body
    ) {
        if (!body.containsKey("token")) {
            return new Respond<>(false, "参数错误", null);
        }
        if (!(body.get("token") instanceof String)) {
            return new Respond<>(false, "参数类型错误", null);
        }

        // 验证权限
        if (!CheckToken.checkTokenWeb(body.get("token").toString())) {
            return new Respond<>(false, "token无效", null);
        }

        // 清空
        PhotoPool.getInstance().cleanData();
        return new Respond<>(true, "已执行", null);
    }
}
