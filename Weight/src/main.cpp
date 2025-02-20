#include <Arduino.h>
#include "balanza.h"

float lastWeight = 0.0;  // Última lectura registrada
const float WEIGHT_THRESHOLD = 2.0; // Umbral para detectar cambio de peso
const int STABLE_TIME_REQUIRED = 100; // Tiempo en milisegundos que el peso debe ser estable (2 segundos)
unsigned long stableStartTime = 0;  // Tiempo en que el peso se mantiene estable
bool weightPrinted = false; // Para evitar imprimir valores intermedios

void setup() {
    Serial.begin(57600);
    setupLoadCell();
}

void loop() {
    actualizarLoadCell();  // ✅ Actualiza la celda de carga una vez por ciclo
    float weight = obtenerPeso(); // ✅ Obtener peso actualizado

    // Si el peso cambia significativamente, reiniciar el contador de tiempo estable
    if (abs(weight - lastWeight) > WEIGHT_THRESHOLD) {
        stableStartTime = millis();  // Reiniciar tiempo de estabilidad
        weightPrinted = false;  
    }

    // ✅ Solo imprimimos si el peso se mantiene estable por `STABLE_TIME_REQUIRED` milisegundos
    if ((millis() - stableStartTime) >= STABLE_TIME_REQUIRED && !weightPrinted) {
        Serial.print("Peso final: ");
        Serial.println(weight);
        weightPrinted = true;  // Evita imprimir múltiples veces el mismo peso
    }

    lastWeight = weight; // Guardamos la última lectura
}
