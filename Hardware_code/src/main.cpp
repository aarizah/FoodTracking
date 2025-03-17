#include "camera.h"
#include "wireless.h"
#include "balanza.h"
#include "boton.h"

float lastWeight = 0.0;  // Última lectura registrada
const float WEIGHT_THRESHOLD = 2.0; // Umbral para detectar cambio de peso
const int STABLE_TIME_REQUIRED = 100; // Tiempo en milisegundos que el peso debe ser estable (2 segundos)
unsigned long stableStartTime = 0;  // Tiempo en que el peso se mantiene estable
bool weightPrinted = false; // Para evitar imprimir valores intermedios
int id_number=1; // Identificador de envío




void setup() {
  Serial.begin(115200);
  wifi_setup();
  camera_setup();
  ota_setup();  // ✅ Inicializar OTA
  loadcell_setup();
  boton_setup();
  delay(5000);
}

void loop() {
  ota_handle();  // ✅ Procesar OTA en cada ciclo
  String id = String(id_number) ; // Identificador de envío

  actualizarLoadCell();  // ✅ Actualiza la celda de carga una vez por ciclo
  float weight = obtenerPeso(); // ✅ Obtener peso actualizado


  if (presionar_boton()) {
    Serial.println("Botón presionado!");
    id_number++;
    camera_fb_t *fb= capture_image();
    send_image(fb->len, fb->buf, id,"1");
    esp_camera_fb_return(fb);
    send_weight(weight,id,"1");
  }


      

      // Si el peso cambia significativamente, reiniciar el contador de tiempo estable
      if (abs(weight - lastWeight) > WEIGHT_THRESHOLD) {
        stableStartTime = millis();  // Reiniciar tiempo de estabilidad
        weightPrinted = false;  
    }

    // ✅ Solo imprimimos si el peso se mantiene estable por `STABLE_TIME_REQUIRED` milisegundos
    if ((millis() - stableStartTime) >= STABLE_TIME_REQUIRED && !weightPrinted) {
      id_number++;
      
      camera_fb_t *fb= capture_image();
      send_image(fb->len, fb->buf, id,"0");
      esp_camera_fb_return(fb);
      send_weight(weight,id,"0");
      weightPrinted = true;  // Evita imprimir múltiples veces el mismo peso
    }

    lastWeight = weight; // Guardamos la última lectura
}




