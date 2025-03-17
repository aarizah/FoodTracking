#ifndef BOTON_H
#define BOTON_H

#include <Arduino.h>
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"

// 📌 Variable global para el tiempo de la última pulsación del botón
extern volatile TickType_t lastButtonPressTime;
extern TaskHandle_t task_sensors_button;


// 📌 Configuración del botón
void boton_setup();

// 📌 Interrupción del botón
void IRAM_ATTR botonISR();

#endif
