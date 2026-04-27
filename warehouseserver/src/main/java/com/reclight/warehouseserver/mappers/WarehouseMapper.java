package com.reclight.warehouseserver.mappers;

import com.reclight.warehouseserver.entities.EntityLog;
import com.reclight.warehouseserver.entities.EntityWarehouse;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Optional;

@Mapper
public interface WarehouseMapper {
    /**
     * 获取项目列表
     */
    @Select("""
            <script>
            SELECT * FROM warehouse_warehouse
            <where>
                <if test="name != null and name != ''">
                    AND name LIKE CONCAT('%', #{name}, '%')
                </if>
                <if test="status != null">
                    AND status = #{status}
                </if>
                <if test="tagList != null and tagList.size() > 0">
                    <foreach collection="tagList" item="tag">
                        AND JSON_CONTAINS(tags, JSON_QUOTE(#{tag}))
                    </foreach>
                </if>
            </where>
            ORDER BY time DESC, id DESC
            </script>
            """)
    List<EntityWarehouse> getWarehouseList2(
            @Param("name") String name,
            @Param("status") Integer status,
            @Param("tagList") List<String> tagList
    );

    // 获取操作记录
    @Select("""
                SELECT * FROM warehouse_log
                ORDER BY time DESC, id DESC
                LIMIT #{limit}
            """)
    List<EntityLog> getLogList(@Param("limit") int limit);

    // 添加项目
    @Insert("""
                INSERT INTO warehouse_warehouse
                (id, name, thumbnail, list, tags, note, status, time)
                VALUES
                (#{id}, #{name}, #{thumbnail}, #{list}, #{tags}, #{note}, 0, UNIX_TIMESTAMP())
            """)
    int addWarehouse(
            @Param("id") String id,
            @Param("name") String name,
            @Param("thumbnail") String thumbnail,
            @Param("list") String list,
            @Param("tags") String tags,
            @Param("note") String note
    );

    // 删除项目
    @Delete("""
                DELETE FROM warehouse_warehouse WHERE id = #{id}
            """)
    int deleteWarehouseById(String id);

    // 修改项目
    @Update("""
                UPDATE warehouse_warehouse SET name = #{name}, thumbnail = #{thumbnail}, list = #{list}, tags = #{tags}, note = #{note} WHERE id = #{id}
            """)
    int updateWarehouse(
            @Param("id") String id,
            @Param("name") String name,
            @Param("thumbnail") String thumbnail,
            @Param("list") String list,
            @Param("tags") String tags,
            @Param("note") String note
    );

    // 修改项目状态
    @Update("""
                UPDATE warehouse_warehouse SET status = #{status} WHERE id = #{id}
            """)
    int updateWarehouseStatus(
            @Param("id") String id,
            @Param("status") int status
    );

    // 修改项目标签
    @Update("""
                UPDATE warehouse_warehouse SET tags = #{tags} WHERE id = #{id}
            """)
    int updateWarehouseTags(
            @Param("id") String id,
            @Param("tags") String tags
    );

    // 通过id查询项目
    @Select("""
                SELECT * FROM warehouse_warehouse WHERE id = #{id}
            """)
    Optional<EntityWarehouse> getWarehouseById(String id);

    // 添加记录
    @Insert("""
                INSERT INTO warehouse_log
                (id, noid, name, type, time) VALUES 
                (null, #{noid}, #{name}, #{type}, #{time})
            """)
    int addLog(
            @Param("noid") String noid,
            @Param("name") String name,
            @Param("type") int type,
            @Param("time") long time
    );

    // 仅获取出库附件
    @Select("""
                SELECT attachment FROM warehouse_outbound_report WHERE id = #{id}
            """)
    String getOutboundAttachmentById(
            @Param("id") String id
    );

    // 仅获取入库附件
    @Select("""
                SELECT attachment FROM warehouse_inbound_report WHERE id = #{id}
            """)
    String getInboundAttachmentById(
            @Param("id") String id
    );
}
