#include "boton.h"

const int botonPin = 14;           // Pin del botón
int estadoBoton = HIGH;            // Estado estable actual (HIGH: no presionado)
int ultimoEstadoBoton = HIGH;      // Última lectura
unsigned long ultimoTiempoDebounce = 0;  // Tiempo del último cambio detectado
const unsigned long retardoDebounce = 50; // Tiempo de debounce (50 ms)
bool accionRealizada = false;      // Flag para evitar múltiples envíos en una sola pulsación


void boton_setup() {
  Serial.begin(115200);
  pinMode(botonPin, INPUT_PULLUP); // Configura el pin con resistencia interna pull-up
}


// Función para detectar una única pulsación del botón
bool presionar_boton() {
  int lectura = digitalRead(botonPin); // Lectura actual del botón

  // Si se detecta un cambio, se reinicia el contador de debounce
  if (lectura != ultimoEstadoBoton) {
    ultimoTiempoDebounce = millis();
  }

  // Si el cambio se mantiene estable por más de 'retardoDebounce' milisegundos
  if ((millis() - ultimoTiempoDebounce) > retardoDebounce) {
    // Si la lectura estable difiere del estado previamente guardado
    if (lectura != estadoBoton) {
      estadoBoton = lectura;

      // Cuando se detecta que el botón se presiona (LOW)
      if (estadoBoton == LOW) {
        if (!accionRealizada) {  // Solo se ejecuta una vez por pulsación
          accionRealizada = true;
          ultimoEstadoBoton = lectura;  // Actualizar el estado anterior
          return true;  // Devuelve 'true' solo una vez por pulsación
        }
      } else {
        // Al liberar el botón, se reinicia el flag para permitir un nuevo envío
        accionRealizada = false;
      }
    }
  }

  ultimoEstadoBoton = lectura;
  return false; // Solo devuelve 'true' una vez por pulsación
}
