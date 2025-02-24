#include <Arduino.h>
#include "camera.h"
#include "wireless.h"

void setup() {
  Serial.begin(115200);
  delay(1000);
  wifi_setup();
  camera_setup();

}

void loop() {
    camera_fb_t *fb= capture_image();
    send_image(fb->len, fb->buf);
    esp_camera_fb_return(fb);
    send_weight(12.2);
    send_string("Memoria libre: " + String(ESP.getFreeHeap()) + " bytes");

  
  delay(10000);  // Espera 10 segundos antes de la siguiente captura
}
