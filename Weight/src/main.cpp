#include <Arduino.h>
#include <HX711_ADC.h>

void calibrate();
void changeSavedCalFactor();

// Pins:
const int HX711_dout = 4; // mcu > HX711 dout pin
const int HX711_sck = 5; // mcu > HX711 sck pin

// HX711 constructor:
HX711_ADC LoadCell(HX711_dout, HX711_sck);

unsigned long t = 0;
float lastWeight = 0.0;  // Última lectura registrada
const float WEIGHT_THRESHOLD = 2.0; // Umbral para detectar cambio de peso
const int STABLE_COUNT_REQUIRED = 5; // Número de lecturas estables antes de imprimir

int stableCount = 0;  // Contador de estabilidad
bool weightPrinted = false; // Para evitar imprimir valores intermedios

void setup() {
  Serial.begin(57600);
  delay(10);
  Serial.println();
  Serial.println("Starting...");

  LoadCell.begin();
  
  // ⚡ tiempo de estabilización inicial
  unsigned long stabilizingtime = 1000;  
  boolean _tare = true;
  LoadCell.start(stabilizingtime, _tare);

  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, revisa las conexiones con el HX711");
    while (1);
  } else {
    LoadCell.setCalFactor(496.33); 
    Serial.println("Startup completo");
  }

  // ⚡ Reducimos el número de muestras para lectura más rápida
  LoadCell.setSamplesInUse(4);
}

void loop() {
  static boolean newDataReady = false;

  if (LoadCell.update()) newDataReady = true;

  if (newDataReady) {
    float weight = LoadCell.getData(); // Obtiene la lectura actual

    // Si el peso ha cambiado significativamente, reiniciar contador
    if (abs(weight - lastWeight) > WEIGHT_THRESHOLD) {
      stableCount = 0;  // Reiniciar estabilidad porque el peso está cambiando
      weightPrinted = false; // Aún no imprimir
    } else {
      stableCount++; // Aumenta estabilidad si el peso no varía mucho
    }

    // Solo imprimimos cuando el peso se ha mantenido estable varias veces seguidas
    if (stableCount >= STABLE_COUNT_REQUIRED && !weightPrinted) {
      Serial.print("Peso final: ");
      Serial.println(weight);
      weightPrinted = true; // Evita imprimir más de una vez el mismo peso
    }

    lastWeight = weight; // Guardamos la última lectura
    newDataReady = false;
  }

  // Recibir comandos desde el monitor serie
  if (Serial.available() > 0) {
    char inByte = Serial.read();
    if (inByte == 't') LoadCell.tareNoDelay(); // Realiza la tara
    else if (inByte == 'r') calibrate(); // Calibra
  }

  // Verifica si la tara ha terminado
  if (LoadCell.getTareStatus()) {
    Serial.println("Tara completa");
  }
}

void calibrate() {
  Serial.println("***");
  Serial.println("Iniciando calibración:");
  Serial.println("Coloca la celda en una superficie estable sin carga.");
  Serial.println("Tienes 3 segundos.");
  delay(1000);
  Serial.println("Tienes 2 segundos.");
  delay(1000);
  Serial.println("Tienes 1 segundo.");
  delay(1000);

  LoadCell.tareNoDelay();
  while (!LoadCell.getTareStatus()) {
    LoadCell.update();
  }
  Serial.println("Tara completa");

  Serial.println("Coloca un peso conocido en la celda.");
  Serial.println("Ingresa el valor del peso en el monitor serie.");

  float known_mass = 0;
  while (known_mass == 0) {
    LoadCell.update();
    if (Serial.available() > 0) {
      known_mass = Serial.parseFloat();
    }
  }

  Serial.print("Peso conocido: ");
  Serial.println(known_mass);

  LoadCell.refreshDataSet();
  float newCalibrationValue = LoadCell.getNewCalibration(known_mass);

  Serial.print("Nuevo valor de calibración: ");
  Serial.println(newCalibrationValue);
}