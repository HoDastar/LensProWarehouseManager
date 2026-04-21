package com.reclight.warehouseserver.entities;

public class EntityWarehouse {
    public String id;
    public String name;
    public String thumbnail;
    public String list;
    public String tags;
    public String note;
    public Integer status;

    public EntityWarehouse() {}

    public EntityWarehouse(String id, String name, String thumbnail, String list, String tags, String note, Integer status) {
        this.id = id;
        this.name = name;
        this.thumbnail = thumbnail;
        this.list = list;
        this.tags = tags;
        this.note = note;
        this.status = status;
    }
}
