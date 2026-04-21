package com.reclight.warehouseserver.mappers;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface InboundReportMapper {

    // 添加入库报告
    @Insert("""
        INSERT INTO warehouse_inbound_report
        (id, attachment, time, note) VALUES 
        (#{id}, #{attachment}, #{time}, #{note})
    """)
    int addInboundReport(
            @Param("id") String id,
            @Param("attachment") String attachment,
            @Param("time") long time,
            @Param("note") String note
    );
}
