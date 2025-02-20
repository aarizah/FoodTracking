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
float lastWeight = 0.0; // Última lectura del peso
const float WEIGHT_THRESHOLD = 2.0; // Umbral en gramos

void setup() {
  Serial.begin(57600);
  delay(10);
  Serial.println();
  Serial.println("Starting...");

  LoadCell.begin();
  
  // ⚡ Acelerar la estabilización
  unsigned long stabilizingtime = 500;  // Reducido de 2000 ms a 500 ms
  boolean _tare = true;
  LoadCell.start(stabilizingtime, _tare);

  if (LoadCell.getTareTimeoutFlag() || LoadCell.getSignalTimeoutFlag()) {
    Serial.println("Timeout, check MCU>HX711 wiring and pin designations");
    while (1);
  } else {
    LoadCell.setCalFactor(496.33); // Factor de calibración
    Serial.println("Startup is complete");
  }

  // ⚡ Reducir el número de muestras para mejorar la velocidad de lectura
  LoadCell.setSamplesInUse(4);  // Valor menor = lectura más rápida (por defecto suele ser 16)
}

void loop() {
  static boolean newDataReady = false;

  // ⚡ Asegurar que el sensor procesa datos lo más rápido posible
  if (LoadCell.update()) newDataReady = true;

  if (newDataReady) {
    float weight = LoadCell.getData(); // Obtiene el nuevo peso
    
    // Si la diferencia es mayor al umbral, imprime el valor
    if (abs(weight - lastWeight) > WEIGHT_THRESHOLD) {
      Serial.print("Peso actual: ");
      Serial.println(weight);
      lastWeight = weight; // Actualiza el último peso registrado
    }

    newDataReady = false;
  }

  // Recibe comandos por el monitor serie
  if (Serial.available() > 0) {
    char inByte = Serial.read();
    if (inByte == 't') LoadCell.tareNoDelay(); // Realiza la tara
    else if (inByte == 'r') calibrate(); // Calibra
  }

  // Verifica si la operación de tara ha finalizado
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
