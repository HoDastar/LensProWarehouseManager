package com.reclight.warehouseserver.controllers;

import com.reclight.warehouseserver.entities.EntityWarehouse;
import com.reclight.warehouseserver.mappers.CheckToken;
import com.reclight.warehouseserver.mappers.InboundReportMapper;
import com.reclight.warehouseserver.mappers.OutBoundReportMapper;
import com.reclight.warehouseserver.mappers.WarehouseMapper;
import com.reclight.warehouseserver.util.FileUtil;
import com.reclight.warehouseserver.util.Respond;
import com.reclight.warehouseserver.util.Utilities;
import org.apache.ibatis.annotations.Param;
import org.apache.tomcat.util.http.fileupload.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/api/warehouse")
@CrossOrigin(originPatterns = "*")
public class WarehouseAPI {
    @Autowired
    public WarehouseMapper warehouseMapper;
    @Autowired
    public OutBoundReportMapper outBoundReportMapper;
    @Autowired
    public InboundReportMapper inboundReportMapper;

    long lastSubmitTime = 0;

    // 获取项目列表
    @GetMapping("/get_list")
    public Respond<List<HashMap<String, Object>>> getWarehouseList(
            @RequestParam(defaultValue = "[]") String tags,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String name
    ) throws Exception {ObjectMapper objMapper = new ObjectMapper();

        List<String> tagsList = objMapper.readValue(tags, List.class);

        List<EntityWarehouse> warehouses = warehouseMapper.getWarehouseList2(name, status, tagsList);

        List<HashMap<String, Object>> data = warehouses.stream().map(warehouse -> {
            HashMap<String, Object> map = new HashMap<>();
            map.put("id", warehouse.id);
            map.put("name", warehouse.name);
            map.put("thumbnail", warehouse.thumbnail);
            try {
                map.put("list", objMapper.readValue(warehouse.list, List.class));
                map.put("tags", objMapper.readValue(warehouse.tags, List.class));
            } catch (Exception e) {
                map.put("list", new ArrayList<>());
                map.put("tags", new ArrayList<>());
            }
            map.put("note", warehouse.note);
            map.put("status", warehouse.status);
            return map;
        }).toList();

        return new Respond<>(true, "查询成功", data);
    }

    // 添加项目
    @PostMapping("/add")
    public Respond<String> addWarehouse(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam("json") String jsonBody
    ) throws Exception {
        long now = System.currentTimeMillis();
        if (now - lastSubmitTime > 1000) {
            lastSubmitTime = now;
        } else {
            return new Respond<>(false, "请勿频繁提交", null);
        }
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> body = mapper.readValue(jsonBody, Map.class);

        // 检查参数
        if (
            !body.containsKey("token") ||
            !body.containsKey("name") ||
            !body.containsKey("list") ||
            !body.containsKey("tags") ||
            !body.containsKey("note")
        ) {
            return new Respond<>(false, "参数错误", null);
        }
        if (
            !(body.get("token") instanceof String) ||
            !(body.get("name") instanceof String) ||
            !(body.get("list") instanceof List) ||
            !(body.get("tags") instanceof List) ||
            !(body.get("note") instanceof String)
        ) {
            return new Respond<>(false, "参数类型错误", null);
        }
        // 验证权限
        if (!CheckToken.checkToken(body.get("token").toString())) {
            return new Respond<>(false, "token无效", null);
        }

        String name = (String) body.get("name");
        List<String> list = (List<String>) body.get("list");
        List<String> tags = (List<String>) body.get("tags");
        String note = (String) body.get("note");

        String listJson = mapper.writeValueAsString(list);
        String tagsJson = mapper.writeValueAsString(tags);
        String thumbnail;

        // 检查名字长度
        if (name.length() > 100) {
            return new Respond<>(false, "提交数据长度过大", null);
        }
        // 检查备注长度
        if (note.length() > 100) {
            return new Respond<>(false, "提交数据长度过大", null);
        }
        // 检查标签数量
        if (tags.size() > 20) {
            return new Respond<>(false, "标签数量超过限制", null);
        }
        // 检查标签中每个标签长度
        for (String tag : tags) {
            if (tag.length() > 20) {
                return new Respond<>(false, "标签长度超过限制", null);
            }
        }
        // 检查列表数量
        if (list.size() > 50) {
            return new Respond<>(false, "列表数量超过限制", null);
        }
        // 检查列表中每个项长度
        for (String item : list) {
            if (item.length() > 50) {
                return new Respond<>(false, "列表项长度超过限制", null);
            }
        }

        // 生成NO + 18位数字ID
        String id = "NO" + Utilities.generateNumber(18);
        String day = Utilities.getNowYMDNumber();

        // 检查上传文件
        if (file != null && !file.isEmpty()) {
            String dirStr = "/data/uploads/warehouses/" + day + "/";
            String extension = FileUtil.getFileExtension(file.getOriginalFilename());
            // 检查文件格式
            if (!FileUtil.isValidImg(extension)) {
                return new Respond<>(false, "文件格式错误", null);
            }
            // 检查文件大小（限制在50MB）
            if (file.getSize() > 50 * 1024 * 1024) {
                return new Respond<>(false, "文件大小超过限制", null);
            }

            String filename = Utilities.generateUUID() + "." + extension;
            FileUtil.saveMultipartFile(file, System.getProperty("user.dir") + dirStr, filename);
            thumbnail = dirStr + filename;
        } else {
            thumbnail = "/data/static/noPhoto.jpg";
        }

        // 数据库操作
        int rowsAffected = warehouseMapper.addWarehouse(id, name, thumbnail, listJson, tagsJson, note);
        if (rowsAffected == 0) {
            return new Respond<>(false, "添加失败，请联系管理员", null);
        }
        int logResult = warehouseMapper.addLog(
                id, name, 2, System.currentTimeMillis()
        );
        if (logResult == 0) {
            return new Respond<>(false, "添加记录失败，请联系管理员", null);
        }

        return new Respond<>(true, "添加成功", null);
    }

    // 通过id查询项目
    @GetMapping("/get_item")
    public Respond<HashMap<String, Object>> getItem(
            @RequestParam("id") String id
    ) throws Exception {

        Optional<EntityWarehouse> warehouse = warehouseMapper.getWarehouseById(id);
        if (warehouse.isEmpty()) {
            return new Respond<>(false, "项目不存在", null);
        }
        ObjectMapper mapper = new ObjectMapper();
        HashMap<String, Object> map = new HashMap<>();
        map.put("id", warehouse.get().id);
        map.put("name", warehouse.get().name);
        map.put("thumbnail", warehouse.get().thumbnail);
        map.put("list", mapper.readValue(warehouse.get().list, List.class));
        map.put("tags", mapper.readValue(warehouse.get().tags, List.class));
        map.put("note", warehouse.get().note);
        map.put("status", warehouse.get().status);
        return new Respond<>(true, "查询成功", map);
    }

    // 获取近期操作记录
    @GetMapping("/get_current_logs")
    public Respond<List<HashMap<String, Object>>> getCurrentLogs(
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        // 获取记录
        List<HashMap<String, Object>> logs = warehouseMapper.getLogList(limit).stream().map(log -> {
            HashMap<String, Object> map = new HashMap<>();
            map.put("id", log.id);
            map.put("noid", log.noid);
            map.put("type", log.type);
            map.put("time", log.time);
            map.put("name", log.name);
            return map;
        }).toList();
        return new Respond<>(true, "查询成功", logs);
    }

    // 修改项目状态
    @PostMapping("/update_status")
    public Respond<String> updateStatus(
            @RequestBody HashMap<String, Object> body
    ) {
        if (!body.containsKey("id") || !body.containsKey("status") || !body.containsKey("token")) {
            return new Respond<>(false, "参数错误", null);
        }
        if (!(body.get("id") instanceof String) || !(body.get("status") instanceof Integer) || !(body.get("token") instanceof String)) {
            return new Respond<>(false, "参数类型错误", null);
        }

        // 验证权限
        if (!CheckToken.checkToken(body.get("token").toString())) {
            return new Respond<>(false, "token无效", null);
        }

        String id = (String) body.get("id");
        int status = (Integer) body.get("status");
        if (status != 0 && status != 1) {
            return new Respond<>(false, "状态值错误", null);
        }

        int rowsAffected = warehouseMapper.updateWarehouseStatus(id, status);
        if (rowsAffected == 0) {
            return new Respond<>(false, "修改失败，请联系管理员", null);
        }
        return new Respond<>(true, "修改成功", null);
    }

    // 修改项目
    @PostMapping("/update")
    public Respond<String> updateWarehouse(
            @RequestParam(value = "file", required = false) MultipartFile iconFile,
            @RequestParam("json") String jsonBody
    ) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> body = mapper.readValue(jsonBody, Map.class);

        // 检查参数
        if (
            !body.containsKey("id") ||
            !body.containsKey("token") ||
            !body.containsKey("name") ||
            !body.containsKey("list") ||
            !body.containsKey("tags") ||
            !body.containsKey("note")
        ) {
            return new Respond<>(false, "参数错误", null);
        }
        if (
            !(body.get("id") instanceof String) ||
            !(body.get("token") instanceof String) ||
            !(body.get("name") instanceof String) ||
            !(body.get("list") instanceof List) ||
            !(body.get("tags") instanceof List) ||
            !(body.get("note") instanceof String)
        ) {
            return new Respond<>(false, "参数类型错误", null);
        }
        // 验证权限
        if (!CheckToken.checkToken(body.get("token").toString())) {
            return new Respond<>(false, "token无效", null);
        }

        String id = (String) body.get("id");
        String name = (String) body.get("name");
        List<String> list = (List<String>) body.get("list");
        List<String> tags = (List<String>) body.get("tags");
        String note = (String) body.get("note");

        String listJson = mapper.writeValueAsString(list);
        String tagsJson = mapper.writeValueAsString(tags);
        String thumbnail;

        // 获取项目
        Optional<EntityWarehouse> warehouseOpt = warehouseMapper.getWarehouseById(id);
        if (warehouseOpt.isEmpty()) {
            return new Respond<>(false, "项目不存在", null);
        }

        // 旧项目的缩略图路径
        String oldThumbnail = warehouseOpt.get().thumbnail;

        // 检查上传文件
        if (iconFile != null && !iconFile.isEmpty()) {
            String day = Utilities.getNowYMDNumber();
            String dirStr = "/data/uploads/warehouses/" + day + "/";
            String extension = FileUtil.getFileExtension(iconFile.getOriginalFilename());
            if (!FileUtil.isValidImg(extension)) {
                return new Respond<>(false, "文件格式错误", null);
            }

            String filename = Utilities.generateUUID() + "." + extension;
            FileUtil.saveMultipartFile(iconFile, System.getProperty("user.dir") + dirStr, filename);
            thumbnail = dirStr + filename;
        } else {
            thumbnail = oldThumbnail;
        }

        // 数据库操作
        int rowsAffected = warehouseMapper.updateWarehouse(id, name, thumbnail, listJson, tagsJson, note);
        if (rowsAffected == 0) {
            return new Respond<>(false, "修改失败，请联系管理员", null);
        }
        return new Respond<>(true, "修改成功", null);

    }

    // 删除项目
    @PostMapping("/delete")
    public Respond<String> deleteWarehouse(
            @RequestBody HashMap<String, Object> body
    ) {
        if (!body.containsKey("id") || !body.containsKey("token")) {
            return new Respond<>(false, "参数错误", null);
        }
        if (!(body.get("id") instanceof String) || !(body.get("token") instanceof String)) {
            return new Respond<>(false, "参数类型错误", null);
        }
        // 验证权限
        if (!CheckToken.checkToken(body.get("token").toString())) {
            return new Respond<>(false, "token无效", null);
        }

        // 获取项目
        Optional<EntityWarehouse> warehouseOpt = warehouseMapper.getWarehouseById(body.get("id").toString());
        if (warehouseOpt.isEmpty()) {
            return new Respond<>(false, "项目不存在", null);
        }

        // 检查项目状态
        if (warehouseOpt.get().status == 1) {
            return new Respond<>(false, "项目已出库，请入库后重试。", null);
        }

        // 获取旧项目的缩略图路径
        String thumbnail = warehouseOpt.get().thumbnail;

        // 删除项目
        int rowsAffected = warehouseMapper.deleteWarehouseById(body.get("id").toString());
        if (rowsAffected == 0) {
            return new Respond<>(false, "删除失败，请联系管理员", null);
        }
        // 尝试删除旧缩略图文件（如果不是默认图片）
        if (!thumbnail.equals("/data/static/noPhoto.jpg")) {
            try {
                FileUtils.forceDelete(new File(System.getProperty("user.dir") + thumbnail));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        // 添加记录
        int logResult = warehouseMapper.addLog(
                body.get("id").toString(), warehouseOpt.get().name, 3, System.currentTimeMillis()
        );
        if (logResult == 0) {
            return new Respond<>(false, "添加记录失败，请联系管理员", null);
        }
        return new Respond<>(true, "删除成功", null);
    }

    // 获取订单所有附件
    @GetMapping("/get_attachment")
    public Respond<Map<String, Object>> getAttachment(
            @RequestParam("id") String id
    ) {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        result.put("outbound", mapper.readValue(
                warehouseMapper.getOutboundAttachmentById(id), List.class
        ));
        result.put("inbound", mapper.readValue(
                warehouseMapper.getInboundAttachmentById(id), List.class
        ));

        return new Respond<>(true, "获取成功", result);
    }

}
