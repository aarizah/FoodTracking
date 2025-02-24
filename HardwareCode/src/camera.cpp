#include <Arduino.h>
#include "esp_camera.h"

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
config.xclk_freq_hz   = 10000000;        
config.pixel_format   = PIXFORMAT_JPEG;  
config.frame_size     = FRAMESIZE_XGA;   
config.jpeg_quality   = 10;              
config.fb_count       = 1;
config.fb_location    = CAMERA_FB_IN_DRAM; 

esp_err_t err = esp_camera_init(&config);
if (err != ESP_OK) {
  Serial.printf("Error al iniciar la cámara: 0x%x\n", err);
  return;
}
Serial.println("Cámara inicializada.");

// Configuración automática del sensor (opcional)
sensor_t * s = esp_camera_sensor_get();
if (s) {
  s->set_brightness(s, 0);
  s->set_contrast(s, 0);
  s->set_saturation(s, 0);
  s->set_special_effect(s, 0);
  s->set_whitebal(s, 1);
  s->set_awb_gain(s, 1);
  s->set_exposure_ctrl(s, 1);
  s->set_aec2(s, 1);
  s->set_ae_level(s, 0);
  s->set_aec_value(s, 300);
  s->set_gain_ctrl(s, 1);
  s->set_agc_gain(s, 0);
  s->set_gainceiling(s, (gainceiling_t)6);
  s->set_bpc(s, 1);
  s->set_wpc(s, 1);
  s->set_raw_gma(s, 1);
  s->set_lenc(s, 1);
  s->set_dcw(s, 1);
  s->set_hmirror(s, 0);
  s->set_vflip(s, 0);
}


}


camera_fb_t *capture_image(){
    camera_fb_t * fb = esp_camera_fb_get(); //Capturando Imagen
    Serial.printf("Imagen capturada. Tamaño: %zu bytes\n", fb->len);
    return fb;
}

