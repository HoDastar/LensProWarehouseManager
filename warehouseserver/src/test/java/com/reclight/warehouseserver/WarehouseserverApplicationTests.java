package com.reclight.warehouseserver;

import com.reclight.warehouseserver.util.Utilities;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class WarehouseserverApplicationTests {

    @Test
    void contextLoads() {
        a();
    }

    void a() {
        System.out.println(Utilities.generateNumber(18));
    }
}
