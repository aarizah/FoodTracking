#include <Arduino.h>
#include "tasks.h"
#include "balanza.h"

void setup() {
    Serial.begin(115200);
    delay(1000);  // Espera a que el puerto serial esté listo
    Serial.println("\n🚀 Iniciando FreeRTOS...");
    loadcell_setup();
    tasks_setup();  // 🔥 Iniciar todas las tareas en FreeRTOS
}

void loop() {
    vTaskDelete(NULL);  // 🔥 No usamos `loop()`, FreeRTOS maneja todo
}
