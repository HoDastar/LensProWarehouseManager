package com.reclight.warehouseserver.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public class CryptUtil {

    // BCrypt
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    // HMAC-SHA256加密
    public static String hmacSha256(String input, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] rawHmac = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // NB加密
    public static String NBEncrypt(String input) {
        try {
            String key = "reclight000X";
            return hmacSha256(input, key);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // BCrypt加密
    public static String BCEcrypt(String input) {
        try {
            return encoder.encode(input);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // BCrypt校验
    public static Boolean checkBCEcrypt(String raw, String secret) {
        return encoder.matches(raw, secret);
    }

    /**
     * byte[] 转 HEX
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String s = Integer.toHexString(0xff & b);
            if (s.length() == 1) hex.append('0');
            hex.append(s);
        }
        return hex.toString();
    }
}
