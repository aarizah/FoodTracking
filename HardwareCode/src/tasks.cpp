#include "tasks.h"
#include "Arduino.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "wireless.h"
#include "balanza.h"
#include "camera.h"
#include "boton.h"

//Struct para enviar los datos
typedef struct {
    float peso;
    image_buffer_t *imagen;
    String prioridad;
} DatosEnvio;


// Manejadores de tareas
TaskHandle_t task_sensors_learn = NULL;
TaskHandle_t task_sensors_button = NULL;
TaskHandle_t task_envio = NULL;
//TaskHandle_t task_ota = NULL;


//Semaforos
SemaphoreHandle_t semaforo_leer_peso; 


//Timer
TimerHandle_t timer_peso;

//Cola
QueueHandle_t colaEnvio; // 📌 Identificador de la cola para controlarla después


void readWeight(TimerHandle_t xTimer) {
    static float lastWeight = 0.0;
    static TickType_t stableStartTime = 0;
    static bool weightPrinted = false;
    const float WEIGHT_THRESHOLD = 2.0;  
    const TickType_t STABLE_TIME_REQUIRED = pdMS_TO_TICKS(500);  

    // Obtener el peso actual con semaforo
    xSemaphoreTake(semaforo_leer_peso, portMAX_DELAY);
    float weight = obtenerPeso();
    xSemaphoreGive(semaforo_leer_peso);

    // Si el peso cambia, reiniciar contador de estabilidad
    if (abs(weight - lastWeight) > WEIGHT_THRESHOLD) {
        stableStartTime = xTaskGetTickCount();
        weightPrinted = false;
    }

    // Si el peso se mantiene estable, enviarlo a la cola
    if ((xTaskGetTickCount() - stableStartTime) >= STABLE_TIME_REQUIRED && !weightPrinted) {
        Serial.print("✅ Peso estable detectado, enviando evento: ");
        Serial.println(weight, 2);  // 🔥 Muestra el peso que se enviará

        BaseType_t xHigherPriorityTaskWoken = pdFALSE;  
        vTaskNotifyGiveFromISR(task_sensors_learn, &xHigherPriorityTaskWoken);
        weightPrinted = true;  // Evita imprimir múltiples veces el mismo peso
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }

    lastWeight = weight;  
}




// 📌 Tarea para capturar imágenes
void taskSensorsLearn(void *pvParameters) {
    DatosEnvio mensajeE;
    float pesoActual = 0;
    mensajeE.prioridad="0";
    while (true) {
            ulTaskNotifyTake(pdTRUE, portMAX_DELAY);            
            xSemaphoreTake(semaforo_leer_peso, portMAX_DELAY);
            pesoActual=obtenerPeso();
            xSemaphoreGive(semaforo_leer_peso);
            image_buffer_t *fb = capture_image();
            mensajeE.imagen=fb;
            mensajeE.peso=pesoActual;
            xQueueSend(colaEnvio, &mensajeE, portMAX_DELAY);
    }
}

// 📌 Tarea para capturar imágenes
void taskSensorsButton(void *pvParameters) {
    DatosEnvio mensajeE;
    float pesoActual = 0;
    mensajeE.prioridad="1";
    while (true) {
            ulTaskNotifyTake(pdTRUE, portMAX_DELAY);
            xSemaphoreTake(semaforo_leer_peso, portMAX_DELAY);
            pesoActual=obtenerPeso();
            xSemaphoreGive(semaforo_leer_peso);
            image_buffer_t *fb = capture_image();
            mensajeE.imagen=fb;
            mensajeE.peso=pesoActual;
            xQueueSend(colaEnvio, &mensajeE, portMAX_DELAY);
    }
}

void taskEnvio(void *pvParameters) {
    DatosEnvio mensajeR; 
    float pesoActual;
    image_buffer_t *imagen;
    int id_number = 1;
    String prioridad;

    while (true) {
        // Obtener cantidad de elementos en la cola antes de recibir
        UBaseType_t elementosEnCola = uxQueueMessagesWaiting(colaEnvio);
        printf("[taskEnvio] Elementos en cola antes de recibir: %d\n", elementosEnCola);

        // Recibir mensaje de la cola
        if (xQueueReceive(colaEnvio, &mensajeR, portMAX_DELAY) == pdPASS) {
            // Guardar datos del mensaje
            imagen = mensajeR.imagen;
            pesoActual = mensajeR.peso;
            prioridad = mensajeR.prioridad;

            // Imprimir información del mensaje recibido
            printf("[taskEnvio] Mensaje recibido:\n");
            printf("  Peso: %.2f\n", pesoActual);
            printf("  Imagen size: %d bytes\n", imagen->len);
            printf("  Prioridad: %s\n", prioridad.c_str());

            // 🔥 Aquí imprimimos la dirección de memoria de la imagen
            printf("  📷 Dirección del puntero imagen: %p\n", (void*)imagen);
            printf("  📂 Dirección del buffer de imagen: %p\n", (void*)imagen->buf);

            // Procesar imagen y peso
            String id = String(id_number); // Identificador de envío
            send_image(imagen->len, imagen->buf, id, prioridad);
            send_weight(pesoActual, id, prioridad);

            //vTaskDelay(pdMS_TO_TICKS(10000));  // Espera 500 ms

            // Incrementar el número de identificación
            id_number++;

            // Mostrar cuántos elementos quedan en la cola después de procesar
            elementosEnCola = uxQueueMessagesWaiting(colaEnvio);
            printf("[taskEnvio] Elementos en cola después de procesar: %d\n", elementosEnCola);
        }
    }
}


// 📌 Función para iniciar todas las tareas
void tasks_setup() {
    //Crear semaforos
    semaforo_leer_peso= xSemaphoreCreateMutex(); 

    //Crear Colas
    colaEnvio = xQueueCreate(30, sizeof(DatosEnvio));   

    //Inicializar Camara
    camera_setup();
    // Inicializar boton
    boton_setup();

    //Conectarse a Wifi
    wifi_setup();

    //Timer peso
    timer_peso= xTimerCreate("TimerPeso", pdMS_TO_TICKS(200),pdTRUE,(void *)0, readWeight );
    xTimerStart(timer_peso, 0);


    //Crear Tareas
    //Tarea Camara
    xTaskCreatePinnedToCore(taskSensorsLearn, "taskSensorsLearn", 8192, NULL, 2, &task_sensors_learn, 1);
    xTaskCreatePinnedToCore(taskSensorsButton, "taskSensorsButton", 8192, NULL, 3, &task_sensors_button, 1);
    xTaskCreatePinnedToCore(taskEnvio, "taskEnvio", 8192, NULL, 3, &task_envio, 0);
}
