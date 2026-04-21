package com.reclight.warehouseserver.mappers;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface AttachmentMapper {
    // 添加
    @Insert("""
        INSERT INTO warehouse_attachment
        (id, name, `key`, time) VALUES 
        (null, #{name}, #{key}, #{time})
    """)
    int add(
            @Param("name") String name,
            @Param("key") String key,
            @Param("time") long time
    );

    // 查询口令
    @Select("""
        SELECT name FROM warehouse_attachment
        WHERE `key` = #{key} ORDER BY id DESC
    """)
    List<String> getAll(@Param("key") String key);
}
