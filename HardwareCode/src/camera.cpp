#include <Arduino.h>
#include "esp_camera.h"
#include "freertos/FreeRTOS.h"  // 🔥 Necesario para vTaskDelay
#include "freertos/task.h"      // 🔥 Necesario para vTaskDelay
#include "camera.h"

#define PWDN_GPIO_NUM    -1
#define RESET_GPIO_NUM   -1
#define XCLK_GPIO_NUM    15
#define SIOD_GPIO_NUM    4
#define SIOC_GPIO_NUM    5
#define Y9_GPIO_NUM      16
#define Y8_GPIO_NUM      17
#define Y7_GPIO_NUM      18
#define Y6_GPIO_NUM      12
#define Y5_GPIO_NUM      10
#define Y4_GPIO_NUM      8
#define Y3_GPIO_NUM      9
#define Y2_GPIO_NUM      11
#define VSYNC_GPIO_NUM   6
#define HREF_GPIO_NUM    7
#define PCLK_GPIO_NUM    13

void camera_setup() {
  // Pines de la cámara (ajusta según tu pinout)

  // Configuración de la cámara
  camera_config_t config;
  config.ledc_channel   = LEDC_CHANNEL_0;
  config.ledc_timer     = LEDC_TIMER_0;
  config.pin_d0         = Y2_GPIO_NUM;
  config.pin_d1         = Y3_GPIO_NUM;
  config.pin_d2         = Y4_GPIO_NUM;
  config.pin_d3         = Y5_GPIO_NUM;
  config.pin_d4         = Y6_GPIO_NUM;
  config.pin_d5         = Y7_GPIO_NUM;
  config.pin_d6         = Y8_GPIO_NUM;
  config.pin_d7         = Y9_GPIO_NUM;
  config.pin_xclk       = XCLK_GPIO_NUM;
  config.pin_pclk       = PCLK_GPIO_NUM;
  config.pin_vsync      = VSYNC_GPIO_NUM;
  config.pin_href       = HREF_GPIO_NUM;
  config.pin_sccb_sda   = SIOD_GPIO_NUM;
  config.pin_sccb_scl   = SIOC_GPIO_NUM;
  config.pin_pwdn       = PWDN_GPIO_NUM;
  config.pin_reset      = RESET_GPIO_NUM;
  config.xclk_freq_hz   = 10000000;        // Frecuencia de reloj
  config.pixel_format   = PIXFORMAT_JPEG;  // Mantiene JPEG para almacenamiento eficiente
  config.frame_size     = FRAMESIZE_XGA;   // Resolución XGA (1024x768) para buen detalle
  config.jpeg_quality   = 10;               // Menos compresión para mejor color y detalles
  config.fb_count = 1;  // 🔥 Permite almacenar hasta 5 imágenes antes de sobrescribir
  config.fb_location = CAMERA_FB_IN_PSRAM;  // 🔥 Guarda las imágenes en PSRAM en lugar de DRAM


  esp_err_t err = esp_camera_init(&config);
  
  if (err != ESP_OK) {
    Serial.printf("Error al iniciar la cámara: 0x%x\n", err);
    return;
  }
  Serial.println("Cámara inicializada.");

  // Configuración del sensor para mejorar colores y exposición
  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);     // -2 to 2
    s->set_contrast(s, 0);       // -2 to 2
    s->set_saturation(s, 0);     // -2 to 2
    s->set_special_effect(s, 0); // 0 to 6 (0 - No Effect, 1 - Negative, 2 - Grayscale, 3 - Red Tint, 4 - Green Tint, 5 - Blue Tint, 6 - Sepia)
    s->set_whitebal(s, 1);       // 0 = disable , 1 = enable
    s->set_awb_gain(s, 1);       // 0 = disable , 1 = enable
    s->set_wb_mode(s, 0);        // 0 to 4 - if awb_gain enabled (0 - Auto, 1 - Sunny, 2 - Cloudy, 3 - Office, 4 - Home)
    s->set_exposure_ctrl(s, 1);  // 0 = disable , 1 = enable
    s->set_aec2(s, 0);           // 0 = disable , 1 = enable
    s->set_ae_level(s, 0);       // -2 to 2
    s->set_aec_value(s, 300);    // 0 to 1200
    s->set_gain_ctrl(s, 1);      // 0 = disable , 1 = enable
    s->set_agc_gain(s, 0);       // 0 to 30
    s->set_gainceiling(s, (gainceiling_t)0);  // 0 to 6
    s->set_bpc(s, 0);            // 0 = disable , 1 = enable
    s->set_wpc(s, 1);            // 0 = disable , 1 = enable
    s->set_raw_gma(s, 1);        // 0 = disable , 1 = enable
    s->set_lenc(s, 1);           // 0 = disable , 1 = enable
    s->set_hmirror(s, 0);        // 0 = disable , 1 = enable
    s->set_vflip(s, 0);          // 0 = disable , 1 = enable
    s->set_dcw(s, 1);            // 0 = disable , 1 = enable
    s->set_colorbar(s, 0);       // 0 = disable , 1 = enable
    
  }


}



#define N 20  // Tamaño del buffer circular de imágenes
#include "esp_heap_caps.h"  // 🔥 Necesario para usar PSRAM

// Buffer circular y variables de control
image_buffer_t image_buffer[N];
int current_index = 0; // Índice actual en el buffer


/**
 * @brief Guarda el frame capturado en el buffer circular.
 * @param fb Frame capturado desde la cámara.
 * @return Puntero a la copia de la imagen almacenada en el buffer.
 */
image_buffer_t *store_frame_in_buffer(camera_fb_t *fb) {
    if (!fb) return NULL; // Si la captura falló, no hacemos nada.

    // Liberar la memoria anterior si hay una imagen en este índice
    if (image_buffer[current_index].buf) {
      heap_caps_free(image_buffer[current_index].buf);  // 🔥 Liberar PSRAM
    }
  

    // Asignar memoria y copiar los datos del frame
    image_buffer[current_index].buf = (uint8_t *)heap_caps_malloc(fb->len, MALLOC_CAP_SPIRAM);

    if (!image_buffer[current_index].buf) {
        Serial.println("⚠️ Error: No se pudo asignar memoria para el buffer.");
        return NULL;
    }

    memcpy(image_buffer[current_index].buf, fb->buf, fb->len);
    image_buffer[current_index].len = fb->len;
    image_buffer[current_index].width = fb->width;
    image_buffer[current_index].height = fb->height;
    image_buffer[current_index].format = fb->format;

    // Guardar índice actual y actualizarlo con aritmética modular
    int stored_index = current_index;
    current_index = (current_index + 1) % N; // Mueve el índice circularmente

    return &image_buffer[stored_index]; // Retornar la imagen almacenada
}

/**
 * @brief Captura una imagen desde la cámara y la almacena en el buffer circular.
 * @return Puntero a la copia de la imagen en el buffer.
 */
 



 image_buffer_t *capture_image() {
  // Captura dummy para limpiar el buffer y obtener la imagen más reciente
  camera_fb_t *dummy = esp_camera_fb_get();
  if (dummy) {
      esp_camera_fb_return(dummy);
  }
  vTaskDelay(50 / portTICK_PERIOD_MS); // Pequeño delay para capturar un nuevo frame

  

  // Captura la imagen actual
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
      Serial.println("⚠️ Error: No se pudo capturar la imagen.");
      return NULL;
  }

  // Guardar en el buffer circular
  image_buffer_t *stored_frame = store_frame_in_buffer(fb);
  esp_camera_fb_return(fb); // Liberar el buffer de la cámara

   // Obtener y mostrar información de la PSRAM
 size_t psram_free = heap_caps_get_free_size(MALLOC_CAP_SPIRAM);
 size_t psram_largest_block = heap_caps_get_largest_free_block(MALLOC_CAP_SPIRAM);
 
 printf("  🧠 Memoria PSRAM disponible: %d bytes\n", psram_free);
 printf("  🔳 Bloque libre más grande en PSRAM: %d bytes\n", psram_largest_block);

  return stored_frame; // Retornar la copia de la imagen almacenada en el buffer
}




