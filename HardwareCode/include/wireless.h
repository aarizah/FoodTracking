#ifndef WIRELESS_H
#define WIRELESS_H

#include <WiFi.h>
#include <HTTPClient.h>
#include <Arduino.h>
#include "esp_camera.h"
#include <ArduinoJson.h>  // Librería para manejar JSON
#include <ArduinoOTA.h>  // ✅ Incluir librería OTA


void send_weight(float weight, String id, String ID_prior);
void send_string(String str);
void wifi_setup(); // Inicializa la cámara
void ota_setup();   // ✅ Configuración OTA
void ota_handle();  // ✅ Manejo OTA en cada loop
camera_fb_t* capturarImagen(); // Captura una imagen y devuelve un puntero a ella
void send_image(size_t size, uint8_t *data, String imageID, String ID_prior); // Envía una imagen a un servidor
#endif // WIRELESS_H
