package com.reclight.warehouseserver.mappers;

import com.reclight.warehouseserver.entities.EntityOrder;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Mapper
public interface OrderMapper {
    // 添加出库报告
    @Insert("""
        INSERT INTO warehouse_order
        (id, username, tel, goods, start_time, end_time, create_time, note, status) VALUES 
        (#{id}, #{username}, #{tel}, #{goods}, #{start_time}, #{end_time}, #{create_time}, #{note}, 0)
    """)
    int addReport(
            @Param("id") String id,
            @Param("username") String username,
            @Param("tel") String tel,
            @Param("goods") String goods,
            @Param("start_time") LocalDate start_time,
            @Param("end_time") LocalDate end_time,
            @Param("create_time") long create_time,
            @Param("note") String note
    );

    // 根据ID获取出库报告
    @Select("""
        SELECT * FROM warehouse_order WHERE id = #{id}
    """)
    Optional<EntityOrder> getReportById(
            @Param("id") String id
    );

    // 获取出库报告列表
    @Select("""
        SELECT * FROM warehouse_order
        ORDER BY create_time DESC, id DESC 
    """)
    List<EntityOrder> getReportsList();

    // 修改订单状态
    @Update("""
        UPDATE warehouse_order SET status = #{status}
        WHERE id = #{id}
    """)
    int updateReportStatus(
            @Param("status") int status,
            @Param("id") String id
    );
    // 仅获取出库附件
    @Select("""
        SELECT outbound FROM warehouse_attachment WHERE id = #{id}
    """)
    String getOutboundAttachmentById(
            @Param("id") String id
    );

    // 仅获取入库附件
    @Select("""
        SELECT inbound FROM warehouse_attachment WHERE id = #{id}
    """)
    String getInboundAttachmentById(
            @Param("id") String id
    );
}
