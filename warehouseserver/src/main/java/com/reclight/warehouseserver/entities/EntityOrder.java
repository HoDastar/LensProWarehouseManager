package com.reclight.warehouseserver.entities;

import java.time.LocalDate;

public class EntityOrder {
    public String id;
    public String username;
    public String tel;
    public String goods;
    public LocalDate startTime;
    public LocalDate endTime;
    public String note;
    public int status;

    public EntityOrder() {
    }

    public EntityOrder(String id, String username, String tel, String goods, LocalDate start_time, LocalDate end_time, String note, int status) {
        this.id = id;
        this.username = username;
        this.tel = tel;
        this.goods = goods;
        this.startTime = start_time;
        this.endTime = end_time;
        this.note = note;
        this.status = status;
    }
}
