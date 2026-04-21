package com.reclight.warehouseserver.mappers;

import com.reclight.warehouseserver.util.CryptUtil;
import com.reclight.warehouseserver.util.FileUtil;
import com.reclight.warehouseserver.util.Respond;

import java.io.File;

public class CheckToken {
        public static boolean checkToken(String token) {
            String sessionToken = CryptUtil.NBEncrypt(token);
            String dirStr = System.getProperty("user.dir") + File.separator + "loginSession" + File.separator + "login.session";
            File sessionFile = new File(dirStr);
            if (!sessionFile.exists()) {
                return false;
            }
            try {
                String storedToken = FileUtil.readDocumentFile(dirStr);
                if (storedToken.equals(sessionToken)) {
                    return true;
                } else {
                    return false;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
        public static boolean checkTokenWeb(String token) {
            String sessionToken = CryptUtil.NBEncrypt(token);
            String dirStrWeb = System.getProperty("user.dir") + File.separator + "loginSession" + File.separator + "loginWeb.session";
            File sessionFileWeb = new File(dirStrWeb);
            if (!sessionFileWeb.exists()) {
                return false;
            }
            try {
                String storedToken = FileUtil.readDocumentFile(dirStrWeb);
                if (storedToken.equals(sessionToken)) {
                    return true;
                } else {
                    return false;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
}
