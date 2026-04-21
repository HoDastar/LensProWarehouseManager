package com.reclight.warehouseserver.util;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class Utilities {
    // 生成uuid
    public static String generateUUID() {
        return java.util.UUID.randomUUID().toString();
    }
    // 生成数字
    public static String generateNumber(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10)); // 0~9
        }
        return sb.toString();
    }
    // 获取当前年月日数字字符串
    public static String getNowYMDNumber() {
        return LocalDate.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }
    // 获取当前年月日时分秒数字字符串
    public static String getNowYMDHMSNumber() {
        return java.time.LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
    // 秒级时间戳
    public static int getNowTimestamp() {
        return (int) (System.currentTimeMillis() / 1000);
    }
    // 根据每页数量和页码计算 SQL 查询的 OFFSET 和 LIMIT
    public static int[] calculateOffsetLimit(int page, int pageSize) {
        int offset = (page - 1) * pageSize;
        return new int[]{offset, pageSize};
    }
}
