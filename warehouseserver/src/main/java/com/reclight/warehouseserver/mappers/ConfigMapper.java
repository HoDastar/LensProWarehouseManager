package com.reclight.warehouseserver.mappers;

import com.reclight.warehouseserver.entities.EntityConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Map;

@Mapper
public interface ConfigMapper {
    @Select("""
    SELECT value FROM warehouse_config WHERE id = #{id}
    """)
    String getConfigById(int id);

    @Update("""
    UPDATE warehouse_config SET value = #{value} WHERE id = #{id}
    """)
    int updateConfigById(
            @Param("value") String value,
            @Param("id") int id
    );

    // 更新日志
    @Select("""
    SELECT version, content FROM warehouse_version_log ORDER BY id DESC LIMIT 5
    """)
    List<Map<String, String>> getVersionLog();
}
