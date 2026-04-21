package com.reclight.warehouseserver.controllers;

import com.google.zxing.WriterException;
import com.reclight.warehouseserver.util.QrCodeUtil;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api")
public class GetORQRCode {
    @GetMapping("get_or_qr_code")
    public ResponseEntity<byte[]> getORQRCode(@RequestParam("text") String text)
            throws WriterException, IOException {

        byte[] image = QrCodeUtil.generateQRCode(text, 300, 300);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=qrcode.png")
                .contentType(MediaType.IMAGE_PNG)
                .body(image);

    }
}
