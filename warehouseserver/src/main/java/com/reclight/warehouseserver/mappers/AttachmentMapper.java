package com.reclight.warehouseserver.mappers;

import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface AttachmentMapper {
    // 出库时添加
    @Insert("""
        INSERT INTO warehouse_attachment
        (id, outbound, inbound) VALUES 
        (#{id}, #{outbound}, '[]')
    """)
    int addOutbound(
            @Param("id") String id,
            @Param("outbound") String outbound
    );

    // 入库时添加
    @Update("""
        UPDATE warehouse_attachment SET inbound = #{inbound} WHERE id = #{id}
    """)
    int addInbound(
            @Param("inbound") String inbound,
            @Param("id") String id
    );
}
