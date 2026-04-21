package com.reclight.warehouseserver.util;

public class Respond<T> {
    public boolean result;
    public String msg;
    public T data;

    public Respond() {}

    public Respond(boolean result, String message, T data) {
        this.result = result;
        this.msg = message;
        this.data = data;
    }
}
