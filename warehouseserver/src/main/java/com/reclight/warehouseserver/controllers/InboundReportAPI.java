package com.reclight.warehouseserver.controllers;

import com.reclight.warehouseserver.entities.EntityOutboundReport;
import com.reclight.warehouseserver.entities.EntityWarehouse;
import com.reclight.warehouseserver.mappers.*;
import com.reclight.warehouseserver.util.Respond;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inbound_report")
public class InboundReportAPI {
    @Autowired
    public InboundReportMapper inboundReportMapper;
    @Autowired
    public OutBoundReportMapper outboundReportMapper;
    @Autowired
    public WarehouseMapper warehouseMapper;

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
        Optional<EntityOutboundReport> outboundReportOpt = outboundReportMapper.getReportById(id);
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
        int rowsAffected = outboundReportMapper.updateReportStatus(1, id);
        if (rowsAffected == 0) {
            return new Respond<>(false, "执行失败，请联系管理员", null);
        }
        // 入库报告
        int rowsAffected2 = inboundReportMapper.addInboundReport(
                id, objMapper.writeValueAsString(photos), System.currentTimeMillis(), note
        );
        if (rowsAffected2 == 0) {
            return new Respond<>(false, "执行失败2，请联系管理员", null);
        }

        // 清除池子
        PhotoPool.getInstance().cleanData();

        return new Respond<>(true, "执行完成", null);
    }
}
