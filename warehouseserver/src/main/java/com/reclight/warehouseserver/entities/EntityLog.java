package com.reclight.warehouseserver.entities;

public class EntityLog {
    public int id;
    public String noid;
    public String name;
    public int type;
    public long time;

    public EntityLog() {}

    public EntityLog(int id, String noid, String name, int type, long time) {
        this.id = id;
        this.noid = noid;
        this.name = name;
        this.type = type;
        this.time = time;
    }
}
