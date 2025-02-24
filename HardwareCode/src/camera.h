#ifndef CAMERA_H
#define CAMERA_H

#include "esp_camera.h"
#include <Arduino.h>

void camera_setup(); // Inicializa la cámara
camera_fb_t* capture_image(); // Captura una imagen y devuelve un puntero a ella

#endif // CAMERA_HANDLER_H