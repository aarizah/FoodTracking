#include "boton.h"
#include "tasks.h"  // Para acceder a la cola de captura

#define BOTON_PIN 14                  // Define el pin del botón
#define DEBOUNCE_TIME pdMS_TO_TICKS(300) // 300 ms en ticks de FreeRTOS

volatile TickType_t lastButtonPressTime = 0;  // Guarda el tiempo de la última pulsación

void boton_setup() {
    pinMode(BOTON_PIN, INPUT_PULLUP);
    attachInterrupt(BOTON_PIN, botonISR, FALLING);  // Configurar interrupción para flanco de bajada
}

void IRAM_ATTR botonISR() {
    TickType_t currentTime = xTaskGetTickCount();

    // Si han pasado menos de 50ms desde la última pulsación, ignorar (debounce)
    if ((currentTime - lastButtonPressTime) < DEBOUNCE_TIME) {
        return;
    }
    
    lastButtonPressTime = currentTime;  // Actualizar el tiempo de la última pulsación

    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    vTaskNotifyGiveFromISR(task_sensors_button, &xHigherPriorityTaskWoken);
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
