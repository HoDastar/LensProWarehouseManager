package com.reclight.warehouseserver.controllers;

import com.reclight.warehouseserver.entities.EntityOrder;
import com.reclight.warehouseserver.entities.EntityOutboundReport;
import com.reclight.warehouseserver.entities.EntityWarehouse;
import com.reclight.warehouseserver.mappers.*;
import com.reclight.warehouseserver.util.Respond;
import com.reclight.warehouseserver.util.Utilities;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/order")
public class OrderAPI {
    @Autowired
    private OrderMapper orderMapper;
    @Autowired
    private WarehouseMapper warehouseMapper;
    long lastSubmitTime = 0;
    @Autowired
    private AttachmentMapper attachmentMapper;

    // 出库
    @PostMapping("/addA")
    public Respond<String> addReportA(
            @RequestBody HashMap<String, Object> body
    ) {
        long nowTime = System.currentTimeMillis();
        if (nowTime - lastSubmitTime > 1000) {
            lastSubmitTime = nowTime;
        } else {
            return new Respond<>(false, "请勿频繁提交", null);
        }

        // 检查参数
        if (
                !body.containsKey("username") ||
                        !body.containsKey("tel") ||
                        !body.containsKey("goods") ||
                        !body.containsKey("end_time") ||
                        !body.containsKey("note")
        ) {
            return new Respond<>(false, "参数错误", null);
        }
        if (
                !(body.get("username") instanceof String) ||
                        !(body.get("tel") instanceof String) ||
                        !(body.get("goods") instanceof List) ||
                        !(body.get("end_time") instanceof String) ||
                        !(body.get("note") instanceof String)
        ) {
            return new Respond<>(false, "参数类型错误", null);
        }
        String username = (String) body.get("username");
        String tel = (String) body.get("tel");
        List<String> goods = (List<String>) body.get("goods");
        String end_time = (String) body.get("end_time");
        String note = (String) body.get("note");

        // 检查名字长度
        if (username.length() > 100) {
            return new Respond<>(false, "提交数据长度过大", null);
        }
        // 检查电话号码合法性
        if (!tel.matches("^1[3-9]\\d{9}$")) {
            return new Respond<>(false, "电话号码格式错误", null);
        }
        // 检查物品数量
        if (goods.isEmpty()) {
            return new Respond<>(false, "数据异常", null);
        }

        Map<String, String> nameMap = new HashMap<>();
        // 对每个物品进行检查
        for (String good : goods) {
            // 获取物品信息
            Optional<EntityWarehouse> a = warehouseMapper.getWarehouseById(good);
            // 检查物品是否存在
            if (a.isEmpty()) {
                return new Respond<>(false, "物品 " + good + " 不存在，出库失败", null);
            }
            // 检查物品状态
            if (a.get().status != 0) {
                return new Respond<>(false, "物品 " + good + " 已出库，出库失败", null);
            }
            // 记录物品名称
            nameMap.put(good, a.get().name);
        }

        // 获取上传附件
        List<String> photos = PhotoPool.getInstance().getData();
        // 检查数量
        if (photos.isEmpty()) {
            return new Respond<>(false, "未上传附件", null);
        }

        // 获取当前时间
        LocalDate nowDate = LocalDate.now();
        // 获取结束时间
        LocalDate endDate = LocalDate.parse(end_time);
        // 检查结束时间合法性
        if (endDate.isBefore(nowDate)) {
            return new Respond<>(false, "结束时间无效", null);
        }
        // 生成id
        String id = "OR" + Utilities.getNowYMDHMSNumber() + Utilities.generateNumber(6);
        // 转换goods为json字符串
        ObjectMapper mapper = new ObjectMapper();
        String goodsStr = mapper.writeValueAsString(goods);
        String attachmentStr = mapper.writeValueAsString(photos);
        // 添加报告
        int result = orderMapper.addReport(
                id, username, tel, goodsStr, nowDate, endDate, System.currentTimeMillis(), note
        );
        if (result == 0) {
            return new Respond<>(false, "提交失败，请联系管理员", null);
        }
        // 记录附件
        int resultAttachment = attachmentMapper.addOutbound(id, attachmentStr);
        if (resultAttachment == 0) {
            return new Respond<>(false, "提交附件失败，请联系管理员", null);
        }
        for (Map.Entry<String, String> entry : nameMap.entrySet()) {
            // 记录日志
            warehouseMapper.addLog(
                    entry.getKey(), entry.getValue(), 1, nowTime
            );
            // 修改物品状态
            warehouseMapper.updateWarehouseStatus(
                    entry.getKey(), 1
            );
        }
        // 清除池子
        PhotoPool.getInstance().cleanData();

        return new Respond<>(true, "提交成功", id);
    }

    // 根据ID获取出库报告
    @GetMapping("/get_outbound_report")
    public Respond<Map<String, Object>> getReport(
            @RequestParam("id") String id
    ) {
        // 获取报告
        Optional<EntityOrder> outboundReportOpt = orderMapper.getReportById(id);
        if (outboundReportOpt.isEmpty()) {
            return new Respond<>(false, "没有此报告", null);
        }
        Map<String, Object> result = outboundReportOpt.map(body -> {
            ObjectMapper objMapper = new ObjectMapper();
            Map<String, Object> map = new HashMap<>();
            map.put("id", id);
            map.put("username", body.username);
            map.put("tel", body.tel);
            map.put("goods", objMapper.readValue(body.goods, List.class));
            map.put("start_time", body.startTime);
            map.put("end_time", body.endTime);
            map.put("note", body.note);
            map.put("status", body.status);
            return map;
        }).orElse(new HashMap<>());

        return new Respond<>(true, "获取成功", result);
    }

    // 获取出库报告列表
    @GetMapping("/get_outbound_report_list")
    public Respond<List<EntityOrder>> getReportList() {
        return new Respond<>(true, "获取成功", orderMapper.getReportsList());
    }

    // 根据ID完结订单（入库所有并改出库报告状态）
    @PostMapping("/finish_order")
    public Respond<String> finishOrder(
            @RequestBody HashMap<String, Object> body
    ) {
        // 检查参数
        if (!body.containsKey("id") || !body.containsKey("token") || !body.containsKey("note")) {
            return new Respond<>(false, "参数错误", null);
        }
        if (!(body.get("id") instanceof String) || !(body.get("token") instanceof String) || !((body.get("note")) instanceof  String)) {
            return new Respond<>(false, "参数类型错误", null);
        }

        // 获取参数
        String id = (String) body.get("id");
        String token = (String) body.get("token");
        String note = (String) body.get("note");

        // 验证权限
        if (!CheckToken.checkToken(token)) {
            return new Respond<>(false, "token无效", null);
        }

        // 获取报告
        Optional<EntityOrder> outboundReportOpt = orderMapper.getReportById(id);
        if (outboundReportOpt.isEmpty()) {
            return new Respond<>(false, "没有此报告", null);
        }
        // 检查状态
        if (outboundReportOpt.get().status != 0) {
            return new Respond<>(false, "订单已完结", null);
        }

        // 获取上传附件
        List<String> photos = PhotoPool.getInstance().getData();
        // 检查数量
        if (photos.isEmpty()) {
            return new Respond<>(false, "未上传附件", null);
        }

        ObjectMapper objMapper = new ObjectMapper();
        // 获取物品id列表
        List<String> goods = objMapper.readValue(outboundReportOpt.get().goods, List.class);

        // 入库
        for (String good : goods){
            // 获取物品信息
            Optional<EntityWarehouse> a = warehouseMapper.getWarehouseById(good);
            // 检查物品是否存在
            if (a.isEmpty()) {
                continue;
            }
            // 检查物品状态
            if (a.get().status != 1) {
                continue;
            }
            // 记录日志
            warehouseMapper.addLog(
                    id, a.get().name, 0, System.currentTimeMillis()
            );
            // 修改物品状态
            warehouseMapper.updateWarehouseStatus(
                    good, 0
            );
        }

        // 修改订单状态
        int rowsAffected = orderMapper.updateReportStatus(1, id);
        if (rowsAffected == 0) {
            return new Respond<>(false, "执行失败，请联系管理员", null);
        }
        // 入库报告
        int rowsAffected2 = attachmentMapper.addInbound(objMapper.writeValueAsString(photos), id);
        if (rowsAffected2 == 0) {
            return new Respond<>(false, "执行失败2，请联系管理员", null);
        }

        // 清除池子
        PhotoPool.getInstance().cleanData();

        return new Respond<>(true, "执行完成", null);
    }

    // 获取订单所有附件
    @GetMapping("/get_attachment")
    public Respond<Map<String, Object>> getAttachment(
            @RequestParam("id") String id
    ) {
        Map<String, Object> result = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        result.put("outbound", mapper.readValue(
                orderMapper.getOutboundAttachmentById(id), List.class
        ));
        result.put("inbound", mapper.readValue(
                orderMapper.getInboundAttachmentById(id), List.class
        ));

        return new Respond<>(true, "获取成功", result);
    }
}
