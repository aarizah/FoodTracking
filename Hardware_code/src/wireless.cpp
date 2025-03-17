#include "wireless.h"

// Credenciales WiFi
const char* ssid = "Starlink 2.4";
const char* password = "alex1000";

// URL del servidor (ajusta IP, puerto y ruta)
const char* serverName = "http://192.168.1.88:3000/upload";
const char* serverName2 = "http://192.168.1.88:3000/json";
const char* serverString = "http://192.168.1.88:3000/string";

void wifi_setup(){
      // Conexión WiFi
  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED){
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado.");
  
}


// ✅ Configuración OTA
void ota_setup() {
  ArduinoOTA.setHostname("ESP32S3-OTA");

  ArduinoOTA.onStart([]() {
    Serial.println("Inicio de actualización OTA...");
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\nActualización OTA completada.");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progreso: %u%%\r", (progress * 100) / total);
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error OTA[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Error de autenticación");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Error al comenzar");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Error de conexión");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Error de recepción");
    else if (error == OTA_END_ERROR) Serial.println("Error al finalizar");
  });

  ArduinoOTA.begin();
  Serial.println("OTA listo!");
}

// ✅ Función para manejar OTA en cada loop
void ota_handle() {
  ArduinoOTA.handle();
}



void send_image(size_t size, uint8_t *data, String imageID, String ID_prior) {
  if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi desconectado. No se pudo enviar la imagen.");
      return; // Salir de la función si no hay conexión
  }
  Serial.printf("Empieza el envio de la imagen");
  HTTPClient http;
  http.begin(serverName);
  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Image-ID", imageID);  // Se envía el ID en la cabecera HTTP
  http.addHeader("X-ID-Prior", ID_prior); // Se envía el ID_prior en la cabecera HTTP

  unsigned long startTime = millis(); // ⏳ Registrar tiempo de inicio

  // Enviar la imagen en binario
  int httpResponseCode = http.POST(data, size);

  unsigned long elapsedTime = millis() - startTime; // ⏳ Calcular tiempo transcurrido

  if (httpResponseCode > 0) {
      Serial.printf("✅ Imagen enviada en %lu ms. Código de respuesta: %d\n", elapsedTime, httpResponseCode);
  } else {
      Serial.printf("❌ Error al enviar la imagen: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  http.end(); // Cerrar conexión para liberar memoria
  delay(10);  // Pequeño delay para evitar problemas de conexión
}



void send_string(String str) {
  if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverString);
      
      // Cambia el tipo de contenido a "text/plain" ya que no es JSON
      http.addHeader("Content-Type", "text/plain");

      // Enviar solo el string sin formato JSON
      http.setTimeout(2000);  // ⏳ Máximo 2 segundos esperando respuesta
      int httpResponseCode = http.POST(str);

      if (httpResponseCode > 0) {
          Serial.printf("String enviado. Código de respuesta: %d\n", httpResponseCode);
          String response = http.getString();
          Serial.println("Respuesta del servidor:");
          Serial.println(response);
      } else {
          Serial.printf("Error al enviar el String: %s\n", http.errorToString(httpResponseCode).c_str());
      }

      http.end();
  } else {
      Serial.println("WiFi desconectado. No se pudo enviar el String.");
  }
}


void send_weight(float weight, String id, String ID_prior) {
  if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi desconectado. No se pudo enviar el JSON.");
      return; // Salir de la función si no hay conexión
  }

  HTTPClient http;
  http.begin(serverName2);
  http.addHeader("Content-Type", "application/json");

  // Crear JSON con peso e ID
  JsonDocument jsonDoc;
  jsonDoc["device"] = "ESP32";
  jsonDoc["weight"] = weight;
  jsonDoc["id"] = id;
  jsonDoc["ID_prior"] = ID_prior;

  String jsonStr;
  serializeJson(jsonDoc, jsonStr);

  // Enviar el JSON sin esperar respuesta
  http.POST(jsonStr);

  http.end(); // Cerrar conexión para liberar memoria
  delay(10);  // Pequeño delay para evitar problemas de conexión
}




