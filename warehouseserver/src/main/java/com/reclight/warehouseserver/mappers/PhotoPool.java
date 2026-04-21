package com.reclight.warehouseserver.mappers;

import java.util.ArrayList;
import java.util.List;

public class PhotoPool {
    private static final PhotoPool instance = new PhotoPool();
    private List<String> photosSingleUpload = new ArrayList<>();

    private PhotoPool() {}

    public static PhotoPool getInstance() {
        return instance;
    }

    public List<String> getData() {
        return photosSingleUpload;
    }

    public void setData(String name) {
        this.photosSingleUpload.add(name);
    }

    public void cleanData() {
        this.photosSingleUpload.clear();
    }
}
