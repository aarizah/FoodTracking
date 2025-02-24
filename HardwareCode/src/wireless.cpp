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

void send_image(size_t size, uint8_t *data, String imageID) {
  if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi desconectado. No se pudo enviar la imagen.");
      return; // Salir de la función si no hay conexión
  }

  HTTPClient http;
  http.begin(serverName);
  http.addHeader("Content-Type", "application/octet-stream");
  http.addHeader("X-Image-ID", imageID);  // Se envía el ID en la cabecera HTTP

  // Enviar la imagen en binario sin esperar respuesta
  http.POST(data, size);

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


void send_weight(float weight, String id) {
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

  String jsonStr;
  serializeJson(jsonDoc, jsonStr);

  // Enviar el JSON sin esperar respuesta
  http.POST(jsonStr);

  http.end(); // Cerrar conexión para liberar memoria
  delay(10);  // Pequeño delay para evitar problemas de conexión
}




