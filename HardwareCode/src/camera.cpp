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
  config.xclk_freq_hz   = 10000000;        // Frecuencia de reloj
  config.pixel_format   = PIXFORMAT_JPEG;  // Mantiene JPEG para almacenamiento eficiente
  config.frame_size     = FRAMESIZE_XGA;   // Resolución XGA (1024x768) para buen detalle
  config.jpeg_quality   = 10;               // Menos compresión para mejor color y detalles
  config.fb_count       = 1;
  config.fb_location    = CAMERA_FB_IN_DRAM;

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
    /*
    //Cantidad de Luz que entra al sensor -----------------------------------------
    s->set_exposure_ctrl(s, 0); 
    // 0: Desactiva el control automático de exposición.
    // 1: Activa el control automático de exposición.
    s->set_aec_value(s, 300);   
    // Solo funciona si el control automático de exposición está desactivado.El de arriba
    //Ajusta la cantidad de luz que entra en la imagen.
    //Valores recomendados:
    //100 - 200: Imagen más oscura.
    //250 - 350: Balance estándar.
    //400 - 500: Imagen más iluminada.

    //BALANCE DE BLANCOS -----------------------------
    s->set_whitebal(s, 1);      // **0 desactiva balance de blancos auto**
    
     Solo funciona si el balance de blancos esta activado
    s->set_wb_mode(s, valor);
    0: Automático.
    1: Luz solar (buen balance natural).
    2: Luz nublada (levemente cálido).
    3: Luz fluorescente (reduce azulados).
    4: Luz incandescente (hace la imagen más cálida, menos azulada).
    

    //SATURACIÓN -------------------------------------
    s->set_saturation(s, 0);  // **Mayor saturación** para que el rojo sea más fuerte
    Puedes usar 3,4, valores intermedios
    -2: Imagen más apagada (menos color).
    0: Balance neutro.
    2: Más colores.
    4: Máxima saturación.
    

    //CONTRASTE --------------------------------------
    s->set_contrast(s, 0);    // **Mejora el contraste** para recuperar detalles
    
    -2: Imagen más suave, menos contraste.
    0: Normal.
    2: Más contraste.
    4: Máximo contraste.
    

    //BRILLO -----------------------------------------
    s->set_brightness(s, 0); // **Reduce brillo** para evitar sobreexposición
    
    -2: Imagen más oscura.
    0: Balance neutro.
    2: Más brillo.
    4: Muy brillante.
    

  
    // GANANCIA --------------------------------------
    s->set_gain_ctrl(s, 0);     // Desactiva auto ganancia
    s->set_agc_gain(s, 5);      // Ajusta ganancia manualmente //De 0 a 15. Mucho puede generar ruido



    // COLORES RGB -----------------------------------
    s->set_awb_gain(s, 1);      // **Desactiva ajuste automático de AWB** 1 para activarlo


    

    // Correcciones de calidad
    s->set_lenc(s, 1); // Corrección de lente 0 la desactiva
    /* Si la imagen se ve curvada o distorsionada en los bordes, actívalo (1).
     Si la imagen se ve bien sin curvaturas, puedes desactivarlo (0)

    s->set_bpc(s, 1);  // Corrección de píxeles defectuosos
    /*
     Si ves puntos negros en la imagen, actívalo (1).
     Si no tienes píxeles defectuosos visibles, puedes probar desactivarlo (0).
    

    s->set_wpc(s, 1);  // Corrección de píxeles blancos
    /*
     Si ves puntos blancos que no deberían estar ahí, actívalo (1).
     Si la imagen no tiene este problema, puedes desactivarlo (0).
    */

    // Evita espejar o voltear la imagen
    /*
    0: Imagen normal.
    1: Voltea la imagen.
    
    s->set_hmirror(s, 0);
    s->set_vflip(s, 0);

    */
    
  }
}


camera_fb_t *capture_image(){
  // Captura dummy para limpiar el buffer
  camera_fb_t *dummy = esp_camera_fb_get();
  if (dummy) {
    esp_camera_fb_return(dummy);
  }
  delay(50);  // Un pequeño retardo para que se capture una nueva imagen

  // Captura la imagen actual
  camera_fb_t *fb = esp_camera_fb_get();
  return fb;
}




