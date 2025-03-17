#ifndef CAMERA_H
#define CAMERA_H

#include "esp_camera.h"
#include <Arduino.h>

void camera_setup(); // Inicializa la cámara

// Estructura para almacenar las imágenes en el buffer
typedef struct {
    uint8_t *buf;
    size_t len;
    size_t width;
    size_t height;
    pixformat_t format;
} image_buffer_t;


image_buffer_t *capture_image();

image_buffer_t *store_frame_in_buffer(camera_fb_t *fb);


#endif // CAMERA_HANDLER_H