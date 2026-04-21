package com.reclight.warehouseserver.mappers;

import com.reclight.warehouseserver.entities.EntityOutboundReport;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.parameters.P;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Mapper
public interface OutBoundReportMapper {
    // 添加出库报告
    @Insert("""
        INSERT INTO warehouse_outbound_report
        (id, username, tel, attachment, goods, start_time, end_time, note, status) VALUES 
        (#{id}, #{username}, #{tel}, #{attachment}, #{goods}, #{start_time}, #{end_time}, #{note}, 0)
    """)
    int addReport(
            @Param("id") String id,
            @Param("username") String username,
            @Param("tel") String tel,
            @Param("attachment") String attachment,
            @Param("goods") String goods,
            @Param("start_time") LocalDate start_time,
            @Param("end_time") LocalDate end_time,
            @Param("note") String note
    );

    // 根据ID获取出库报告
    @Select("""
        SELECT * FROM warehouse_outbound_report WHERE id = #{id}
    """)
    Optional<EntityOutboundReport> getReportById(
            @Param("id") String id
    );

    // 获取出库报告列表
    @Select("""
        SELECT * FROM warehouse_outbound_report
        ORDER BY start_time DESC, id DESC 
    """)
    List<EntityOutboundReport> getReportsList();

    // 修改订单状态
    @Update("""
        UPDATE warehouse_outbound_report SET status = #{status}
        WHERE id = #{id}
    """)
    int updateReportStatus(
            @Param("status") int status,
            @Param("id") String id
    );
}
