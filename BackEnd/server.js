const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai'); // Usando el SDK oficial

// Variables para guardar los datos de hardware
let hardware_data_openai=[]; //Variable para guardar los datos que se envian a OpenAI

// Variables para procesar y guardar los datos


// Inicializar el servidor
const app = express();
const port = 3000;

// SERVIDOR ----------------------------------------------------------------------------------

// Middleware para procesar JSON
app.use(express.json({ limit: '5mb' })); //Permite que el servidor reciba JSON con un tamaño máximo de 5MB.

// Middleware para procesar datos binarios (imágenes)
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '10mb' })); //Permite recibir datos binarios (como imágenes) de hasta 10MB en la ruta /upload.


// 📌 Ruta para recibir imágenes en binario
app.post('/upload', (req, res) => {
    const imageID = req.headers['x-image-id']; // Leer el ID desde la cabecera
    const priorID = req.headers['x-id-prior']; // Leer el ID desde la cabecera
    // Obtener la fecha actual en formato YYYYMMDD
    //const now = new Date();
    //const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    // Construir el nombre del archivo
    const fileName = `image_${priorID}_${imageID}.jpg`;
    
    // Construir la ruta absoluta de la carpeta "sin_procesar"
    const filePath = path.join(__dirname, "Images", "sin_procesar",fileName);
  
    // Guardar la imagen en el servidor
    fs.writeFile(filePath, req.body, (err) => {
      if (err) {
        console.error("❌ Error al guardar la imagen:", err);
        return res.status(500).json({ error: "Error al guardar la imagen." });
      }
  
      console.log(`📸 Imagen guardada con ID: ${fileName}`);
      res.json({ message: "Imagen recibida y guardada.", fileName });
    });
  });
  



// 📌 Nueva ruta para recibir JSON
app.post('/json', (req, res) => {
  console.log("📩 JSON recibido:", req.body);
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "El JSON recibido está vacío" });
  }

  res.json({ message: "JSON recibido y procesado"});
  procesar_datos(req.body);
});



// 📌 Nueva ruta para recibir Strings // Aca se inicializa el middleware
app.post('/string', express.text({ type: 'text/plain', limit: '2mb' }), (req, res) => {
    console.log("📩 String recibido:", req.body);
  
    if (!req.body || req.body.trim().length === 0) {
      return res.status(400).json({ error: "El string recibido está vacío" });
    }
  
    res.json({ message: "String recibido y procesado" });
  });
  

// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});










// PROCESAR DATOS ----------------------------------------------------------------------------------



function procesar_datos(json){  
    let peso = json.weight;
    let id = json.id;
    let id_prior = json.ID_prior;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    //  Imagenes/sin_procesar -> Imagenes/descart
    const carpeta = path.join(__dirname, "Images", "sin_procesar");
    if(existeImagen(carpeta,`image_${id_prior}_${id}`)){

        // Imagenes/sin_procesar -> imagenes/procesadas 
      if (id_prior==0){
        if (peso<5){
          const origen = path.join(__dirname, "Images", "sin_procesar");
          const destino = path.join(__dirname, "Images", "descarte");
          moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
      }
      else{
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "procesadas");
        moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
        }
      }

      //Imagenes/sin_procesar -> Imagenes/openAI -> Imagenes/procesadas
      //Hardware_data_openAI.push->.push->.shift->.push->.shift->.push ...
      // API -> Procesar_Datos_Finales -> Guardar_Datos

      else {    
        if (peso<5){
          const origen = path.join(__dirname, "Images", "openAI");
          const destino = path.join(__dirname, "Images", "procesadas");
          moverImagenes(path.join(__dirname, "Images", "sin_procesar"), path.join(__dirname, "Images", "descarte"), `image_${id_prior}_${id}`,formattedDate);
          moverImagenMasAntigua(origen,destino);
          hardware_data_openai=[];
      }
      else{
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "openAI");
        fs.readdir(destino, (_, archivos) => {
            const cantidad = archivos.length;
            //console.log(`Cantidad de imágenes encontradas: ${cantidad}`);

            //Imagen a carpeta openAI y guarda en hardware_data_openai peso,id
            if (cantidad === 0) { 
                moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
                hardware_data_openai.push({"peso":peso,"id":formattedDate});

            } 

            //imagen a carpeta de chatGPT y guarda en hardware_data_openai peso,id
            //llama a la API de openAI
            //llama a procesar datos finales con la diferencia de peso y el resultado de la API
            else if (cantidad === 1) {
                
                
                hardware_data_openai.push({"peso":peso,"id":formattedDate});
                console.log("array variables locales:"+hardware_data_openai);
                const dif_peso= hardware_data_openai[1].peso-hardware_data_openai[0].peso;
                console.log("Dif Peso:"+dif_peso);
                // CALL OPEN AI API 
                // 🔹 EJEMPLO DE USO
                moverImagenes(origen, destino, `image_${id_prior}_${id}`, formattedDate)
                .then(() => {
                    return openAI_API(); // Llamar a la API solo después de que las imágenes se hayan movido
                })
                .then((resultado) => {
                    console.log("🍽️ Respuesta OPEN_AI:", resultado);
                    procesamiento_final(ajson(resultado),dif_peso,formattedDate);
                })
                .catch((error) => {
                    console.error("❌ Error:", error);
                });
            
            } 
            //Quita ultimo valor de hardware_data_openai y agrega el nuevo
            //imagen a carpeta de chatGPT 
            //llama a la API de openAI
            //llama a procesar datos finales con la diferencia de peso y el resultado de la API
            //Quita la imagen más antigua de carpeta chatGPT y la mueve a procesadas
            else {

                const carpetaProcesados = path.join(__dirname, "Images", "procesadas");
                hardware_data_openai.shift();
                hardware_data_openai.push({"peso":peso,"id":formattedDate});
                const dif_peso= hardware_data_openai[1].peso-hardware_data_openai[0].peso;
                console.log("Dif Peso:"+dif_peso);
                // CALL OPEN AI API
                moverImagenes(origen, destino, `image_${id_prior}_${id}`, formattedDate)
                .then(() => {
                    return openAI_API(); // Llamar a la API solo después de que las imágenes se hayan movido
                })
                .then((resultado) => {
                    console.log("🍽️ Respuesta OPEN_AI:", resultado);
                    procesamiento_final(ajson(resultado),dif_peso,formattedDate);
                })
                .catch((error) => {
                    console.error("❌ Error:", error);
                });
                moverImagenMasAntigua(destino, carpetaProcesados);
            }
        });
      }
      } 
    }
    else{
      console.log("Imagen NO LLEGÓ")
    }
    
  //  const json_procesado = {"id":formattedDate,"peso":peso,"id_prior":id_prior};
  // guardarHistorico(json_procesado);
}


function procesamiento_final(json,peso,nombre_imagen){
  const json_procesado=structuredClone(json);
  const filePath = "./registro_alimentos.json";
  const fecha=obtenerFechaActual();
  const horas=obtenerHoraActual();
  //Verificar si ya existe un archivo si no crearlo
  if (!fs.existsSync(filePath)) {
    // Crear la estructura inicial del JSON
    const datosIniciales = [
        {
          "_id": "alexh1000_"+fecha,
          "usuario_id": "alexh1000",
          "fecha": fecha,
          "resumen":{
            "resumenCalorias": 0,
            "resumenGrasas":0,
            "resumenProteinas":0,
            "resumenCarbohidratos":0,
            "resumenFibra":0,
            "resumenHierro":0,
            "resumenCalcio":0,
            "resumenVitaminaD":0,
            "resumenMagnesio":0,
            "resumenZinc":0,
            "resumenVitaminaC":0,
            "resumenOmega3":0,
            "resumenBiotinaB7":0
          },
          "comidas": [{
            "tipo": "1",
            "hora": horas,
            "alimentos":[]
          }],
          "base_datos":[]
        }
    ];
    // Escribir en el archivo con formato JSON
    fs.writeFileSync(filePath, JSON.stringify(datosIniciales, null, 2));
  }

  // Leer el archivo y convertirlo a un objeto JavaScript
  const rawData = fs.readFileSync(filePath, "utf-8"); 
  const registro_alimentos = JSON.parse(rawData); 


  // Si es un nuevo dia
  if (registro_alimentos[registro_alimentos.length-1].fecha!=fecha){

    registro_alimentos.push({
      "_id": "alexh1000_"+fecha,
      "usuario_id": "alexh1000",
      "fecha": fecha,
      "resumen":{
        "resumenCalorias": 0,
        "resumenGrasas":0,
        "resumenProteinas":0,
        "resumenCarbohidratos":0,
        "resumenFibra":0,
        "resumenHierro":0,
        "resumenCalcio":0,
        "resumenVitaminaD":0,
        "resumenMagnesio":0,
        "resumenZinc":0,
        "resumenVitaminaC":0,
        "resumenOmega3":0,
        "resumenBiotinaB7":0
      },
      "comidas": [{
        "tipo": 1,
        "hora": horas,
        "alimentos":[]
      }],
      "base_datos":[]

    });
  }
      //Se le agrega el peso al json
      json.forEach(element => {  
        element["foto"]=nombre_imagen+".jpg";
        registro_alimentos[registro_alimentos.length-1].base_datos.push(element);
      });

    //Verificar la ultima hora y esta hora
    //TRUE YA PASO UNA HORA
    if(tiempoTranscurrido(registro_alimentos[registro_alimentos.length-1].comidas[registro_alimentos[registro_alimentos.length-1].comidas.length-1].hora,horas,3))
      {
        comida_anterior=registro_alimentos[registro_alimentos.length-1].comidas[registro_alimentos[registro_alimentos.length-1].comidas.length-1].tipo;
        
        registro_alimentos[registro_alimentos.length-1].comidas.push({
          "tipo": (+comida_anterior + 1).toString(),
          "hora": horas,
          "alimentos":[]
        });
      }

  // Aca siempre voy a tener Archivo creado, dia actual, comida actual, falta agregarle alimentos



  json_procesado.forEach(element => {
    const peso_cada_ingrediente=peso*element["porcentaje"]/100;
    element["foto"]=nombre_imagen+".jpg";
    element["calorias"]=peso_cada_ingrediente*element["calorias"]/100;//Son por cada 100 gramos
    element["grasas"]=peso_cada_ingrediente*element["grasas"]/100;//Son por cada 100 gramos
    element["proteinas"]=peso_cada_ingrediente*element["proteinas"]/100;//Son por cada 100 gramos
    element["carbohidratos"]=peso_cada_ingrediente*element["carbohidratos"]/100;//Son por cada 100 gramos
    element["fibra"]=peso_cada_ingrediente*element["fibra"]/100;//Son por cada 100 gramos
    element["hierro"]=peso_cada_ingrediente*element["hierro"]/100;//Son por cada 100 gramos
    element["calcio"]=peso_cada_ingrediente*element["calcio"]/100;//Son por cada 100 gramos
    element["vitamina_d"]=peso_cada_ingrediente*element["vitamina_d"]/100;//Son por cada 100 gramos
    element["magnesio"]=peso_cada_ingrediente*element["magnesio"]/100;//Son por cada 100 gramos
    element["zinc"]=peso_cada_ingrediente*element["zinc"]/100;//Son por cada 100 gramos
    element["vitamina_c"]=peso_cada_ingrediente*element["vitamina_c"]/100;//Son por cada 100 gramos
    element["omega3"]=peso_cada_ingrediente*element["omega3"]/100;//Son por cada 100 gramos
    element["biotina_b7"]=peso_cada_ingrediente*element["biotina_b7"]/100;//Son por cada 100 gramos
    element["peso"]=peso;
   registro_alimentos[registro_alimentos.length-1].comidas[registro_alimentos[registro_alimentos.length-1].comidas.length-1].alimentos.push(element);
   
   registro_alimentos[registro_alimentos.length-1].resumen.resumenCalorias+=element["calorias"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenGrasas+=element["grasas"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenProteinas += element["proteinas"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenCarbohidratos += element["carbohidratos"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenFibra += element["fibra"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenHierro += element["hierro"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenCalcio += element["calcio"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenVitaminaD += element["vitamina_d"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenMagnesio += element["magnesio"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenZinc += element["zinc"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenVitaminaC += element["vitamina_c"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenOmega3 += element["omega3"];
   registro_alimentos[registro_alimentos.length-1].resumen.resumenBiotinaB7 += element["biotina_b7"];
   
  });


  fs.writeFileSync(filePath, JSON.stringify(registro_alimentos, null, 2));

}




















// FUNCIONES AUXILIARES ----------------------------------------------------------------------------------

// Mueve Imagen de una carpeta a otra y le cambia el nombre
function moverImagenes(carpetaOrigen, carpetaDestino, criterio, nuevoNombre) {
    return new Promise((resolve, reject) => {
        // Asegurar que la carpeta de destino exista
        if (!fs.existsSync(carpetaDestino)) {
            fs.mkdirSync(carpetaDestino, { recursive: true });
        }

        fs.readdir(carpetaOrigen, (err, archivos) => {
            if (err) {
                return reject(`Error al leer la carpeta: ${err}`);
            }

            // Filtrar archivos que cumplan con el criterio
            const archivosFiltrados = archivos.filter(archivo => archivo.includes(criterio));

            if (archivosFiltrados.length === 0) {
                console.log("No se encontraron archivos para mover.");
                return resolve(); // No hay nada que mover, resolvemos la promesa
            }

            // Array de promesas para mover los archivos
            const promesas = archivosFiltrados.map(archivo => {
                return new Promise((res, rej) => {
                    const extension = path.extname(archivo);
                    const nuevoArchivo = `${nuevoNombre}${extension}`;
                    const rutaOrigen = path.join(carpetaOrigen, archivo);
                    const rutaDestino = path.join(carpetaDestino, nuevoArchivo);

                    fs.rename(rutaOrigen, rutaDestino, (err) => {
                        if (err) {
                            console.error(`Error al mover el archivo ${archivo}:`, err);
                            rej(err);
                        } else {
                            console.log(`✅ Archivo movido: ${archivo} -> ${nuevoArchivo}`);
                            res();
                        }
                    });
                });
            });

            // Esperar a que todos los archivos se muevan antes de resolver
            Promise.all(promesas)
                .then(() => resolve())
                .catch(reject);
        });
    });
}

function existeImagen(carpetaOrigen, criterio) {
  try {
      // Verificar si la carpeta existe
      if (!fs.existsSync(carpetaOrigen)) {
          console.error(`La carpeta ${carpetaOrigen} no existe.`);
          return false;
      }

      // Leer archivos de la carpeta
      const archivos = fs.readdirSync(carpetaOrigen);

      // Verificar si hay archivos que cumplan con el criterio
      const archivosFiltrados = archivos.filter(archivo => archivo.includes(criterio));

      return archivosFiltrados.length > 0;
  } catch (error) {
      console.error(`Error al verificar archivos: ${error}`);
      return false;
  }
}

// Mueve la imagen más antigua de una carpeta a otra
function moverImagenMasAntigua(origen, destino) {
  // Leer la carpeta de origen
  fs.readdir(origen, (err, archivos) => {
      if (err) {
          console.error('Error al leer la carpeta:', err);
          return;
      }

      // Filtrar solo archivos de imagen (opcional)
      const imagenes = archivos.filter(archivo => {
          return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(archivo);
      });

      if (imagenes.length === 0) {
          console.log('No hay imágenes en la carpeta origen.');
          return; // 🚨 Salir de la función si no hay imágenes
      }

      // 📌 Obtener la imagen más antigua
      let imagenMasAntigua = imagenes
          .map(archivo => ({
              nombre: archivo,
              tiempo: fs.statSync(path.join(origen, archivo)).mtime.getTime() // Obtener fecha de modificación
          }))
          .sort((a, b) => a.tiempo - b.tiempo)[0]; // Ordenar por fecha y tomar la más antigua

      if (!imagenMasAntigua) {
          console.log('No se encontró ninguna imagen válida.');
          return;
      }

      const rutaOrigen = path.join(origen, imagenMasAntigua.nombre);
      const rutaDestino = path.join(destino, imagenMasAntigua.nombre);

      // 📌 Asegurar que la carpeta de destino exista
      fs.mkdir(destino, { recursive: true }, (err) => {
          if (err) {
              console.error(`Error al crear la carpeta destino:`, err);
              return;
          }

          // 📌 Mover la imagen sin cambiar el nombre
          fs.rename(rutaOrigen, rutaDestino, (err) => {
              if (err) {
                  console.error(`Error al mover la imagen más antigua:`, err);
              } else {
                  console.log(`Imagen movida: ${imagenMasAntigua.nombre}`);
              }
          });
      });
  });
}

// Función para extraer el JSON de un string
function ajson(casi_json) {
  // Nueva regex para capturar el JSON sin importar qué haya antes
  const regex = /json\s*([\s\S]*?)\s*```/;  

  const match = casi_json.match(regex);
  
  if (match && match[1]) {
      try {
          const json = JSON.parse(match[1].trim()); // Convertimos el texto en JSON
          return json;
      } catch (error) {
          console.error("Error al parsear JSON:", error);
          return null;
      }
  }
  console.warn("No se encontró JSON en la respuesta.");
  return null;
}

// Funcion para obtener la fecha actual en formato YYYY-MM-DD
function obtenerFechaActual() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Meses van de 0-11, sumamos 1
    const dia = String(hoy.getDate()).padStart(2, '0'); // Aseguramos que tenga dos dígitos
    return `${año}-${mes}-${dia}`;
}

// Función para obtener la hora actual en formato HH:MM:SS
function obtenerHoraActual() {
    const ahora = new Date();
    const horas = String(ahora.getHours()).padStart(2, '0'); // Hora en formato 24h
    const minutos = String(ahora.getMinutes()).padStart(2, '0'); // Minutos con 2 dígitos
    const segundos = String(ahora.getSeconds()).padStart(2, '0'); // Segundos con 2 dígitos
    return `${horas}:${minutos}:${segundos}`;
}

// Funcion para saber si ya pasó X tiempo entre una hora y otra. 
function tiempoTranscurrido(horaInicio, horaFin, minutosLimite) {
  // Extraer HH, MM y SS de las horas en formato HH:MM:SS
  const [h1, m1, s1] = horaInicio.split(":").map(Number);
  const [h2, m2, s2] = horaFin.split(":").map(Number);

  // Crear objetos Date con la misma fecha pero con las horas correspondientes
  const fechaReferencia = new Date();
  fechaReferencia.setHours(h1, m1, s1, 0); // Establecer hora de inicio

  const fechaComparacion = new Date();
  fechaComparacion.setHours(h2, m2, s2, 0); // Establecer hora final

  // Calcular la diferencia en milisegundos
  const diferenciaMs = fechaComparacion.getTime() - fechaReferencia.getTime();

  // Convertir minutos a milisegundos
  const limiteMs = minutosLimite * 60 * 1000;

  return diferenciaMs >= limiteMs;
}


// OPEN AI .----------------------------------------------------------------------------------

// 🔹 Inicializa el cliente de OpenAI con tu API Key
const openai = new OpenAI({
  apiKey: "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" // 🔑 Sustituye esto con tu clave de OpenAI
});

async function openAI_API() {
    try {
        // 🔹 RUTA DONDE ESTÁN LAS IMÁGENES
        const directorioImagenes = path.join(__dirname, "Images", "openAI");
        let archivos = fs.readdirSync(directorioImagenes);

        if (archivos.length < 2) {
            console.error("❌ No hay suficientes imágenes en el directorio.");
            return [];
        }

        // Seleccionamos la imagen más antigua y la más reciente
        const nombreImagen1 = archivos[archivos.length - 2]; // Penultima
        const nombreImagen2 = archivos[archivos.length - 1]; // Más nueva
        const rutaImagen1 = path.join(directorioImagenes, nombreImagen1);
        const rutaImagen2 = path.join(directorioImagenes, nombreImagen2);

        // 🔹 LEER Y CONVERTIR LAS IMÁGENES A BASE64
        const imagen1Base64 = fs.readFileSync(rutaImagen1, { encoding: 'base64' });
        const imagen2Base64 = fs.readFileSync(rutaImagen2, { encoding: 'base64' });

        // 🔹 SOLICITUD A OPENAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // ✅ Modelo avanzado para análisis de imágenes
            messages: [
                {
                    "role": "system",
                    "content": `Recibirás dos imágenes: la primera es la referencia y la segunda es la imagen a analizar. 
                    Tu tarea es:

                    🔍 **Comparación**:
                    - Analiza ambas imágenes y detecta qué alimentos aparecen en la segunda imagen que no estaban en la primera.

                    📝 **Generación del Array de Objetos**:
                    - Por cada alimento nuevo detectado, crea un objeto con la siguiente estructura:
                        - **nombre**: Nombre del alimento.
                        - **porcentaje**: No tengas en cuenta lo que habia en la antigua foto, el total de nuevos alimentos=100% **en base al peso que aporta**sin contar antiguos alimentos.
                        - **calorias**: Calorías del ingrediente por cada 100 gramos.
                        - **grasas**: Gramos de grasa por cada 100 gramos.
                        - **proteinas**: Gramos de proteína por cada 100 gramos.
                        - **carbohidratos**: Gramos de carbohidratos por cada 100 gramos.
                        - **fibra**: Cantidad de fibra.
                        - **hierro**: Cantidad de hierro.
                        - **calcio**: Cantidad de calcio.
                        - **vitamina_d**: Cantidad de vitamina D.
                        - **magnesio**: Cantidad de magnesio.
                        - **zinc**: Cantidad de zinc.
                        - **vitamina_c**: Cantidad de vitamina C.
                        - **omega3**: Cantidad de omega-3.
                        - **biotina_b7**: Cantidad de biotina B7.

                    🎯 **Reglas de clasificación**:
                    - **Si se trata de una mezcla**:
                        - Verifica si existe en la base de datos una entrada específica para esa mezcla (ejemplo: ajiaco, espagueti a la boloñesa, arroz con pollo, etc.).
                        - Si existe, utiliza la información de la mezcla completa en lugar de desglosar sus ingredientes.
                    - **Si no es una mezcla**:
                        - Registra cada nuevo alimento de forma individual.
                    - **Si no se detecta ningún alimento nuevo**:
                        - Devuelve un array vacío [].
                    En todos los casos devuelve solo el JSON o array en formato válido, sin texto adicional.
                        `
                    
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Aquí están las imágenes para analizar:" },
                        { 
                            type: "image_url", 
                            image_url: { url: `data:image/jpeg;base64,${imagen1Base64}` }
                        },
                        { 
                            type: "image_url", 
                            image_url: { url: `data:image/jpeg;base64,${imagen2Base64}` }
                        }
                    ]
                }
            ],
            temperature: 0, 
            max_tokens: 1024, 
            top_p: 1, 
            frequency_penalty: 0, 
            presence_penalty: 0 
        });

        // 🔹 PROCESAR RESPUESTA
        const resultado = response.choices[0].message.content;
        return resultado; // Devuelve el array de objetos con la información de los alimentos
    } catch (error) {
        console.error("❌ Error al procesar la solicitud:", error);
        return [];
    }
}












/*
// Ruta del archivo JSON donde se guardará el histórico
const path_historico = path.join(__dirname, 'historico.json');

// Función para cargar los datos actuales del archivo JSON
function cargarHistorico() {
    try {
        if (fs.existsSync(path_historico)) {
            const data = fs.readFileSync(path_historico, 'utf8');
            return JSON.parse(data);
        } else {
            return []; // Si no existe, devuelve un array vacío
        }
    } catch (error) {
        console.error("Error al leer el archivo JSON:", error);
        return [];
    }
}

// Función para agregar un nuevo dato al archivo JSON
function guardarHistorico(nuevoDato) {
    const historico = cargarHistorico(); // Cargar datos previos
    historico.push(nuevoDato); // Agregar nuevo dato

    try {
        fs.writeFileSync(path_historico, JSON.stringify(historico, null, 4), 'utf8'); // Guardar con formato legible
        console.log("✅ Dato agregado al histórico con éxito.");
    } catch (error) {
        console.error("❌ Error al guardar en el archivo JSON:", error);
    }
}
*/














/*
Colección Usuarios
{
   "_id": ObjectId("usuario123"),
   "nombre": "Alex",
   "objetivos": {
      "calorias": 2800,
      "proteinas": 120,
      "grasas": 78
   }
}

Colección Registro de Alimentos
[
  {
    "_id": "alex123_2024-06-02",
    "usuario_id": "alex123", // Aca se enlaza con la colección de Usuarios
    "fecha": "2024-06-02",
    "comidas":[
    {
        "tipo": "desayuno",
        "hora": "08:00:00",
        "alimentos": [
          {
            "nombre": "papaya",
            "foto": "123123123.jpg",
            "calorias": 43,
            "proteinas": 0.5,
            "peso": 200
          },
          {
            "nombre": "banana",
            "calorias": 89,
            "proteinas": 1.1,
            "peso": 150
          }
        ]
      },
      {
        "tipo": "almuerzo",
        "hora": "13:00:00",
        "alimentos": [
          {
            "nombre": "huevo frito",
            "calorias": 196,
            "proteinas": 13.6,
            "peso": 100
          }
        ]
      }
    ],

    "resumen": {
      "total_calorias": 328,
      "total_proteinas": 15.2,
      "total_grasas": 10.2
    },

    "base_datos_comidas": [
      {
        "tipo": "desayuno",
        "hora": "08:00:00",
        "alimentos": [
          {
            "nombre": "papaya",
            "calorias": 43,
            "proteinas": 0.5,
            "peso": 200
          },
          {
            "nombre": "banana",
            "calorias": 89,
            "proteinas": 1.1,
            "peso": 150
          }
        ]
      },
      {
        "tipo": "almuerzo",
        "hora": "13:00:00",
        "alimentos": [
          {
            "nombre": "huevo frito",
            "calorias": 196,
            "proteinas": 13.6,
            "peso": 100
          }
        ]
      }
    ]
  },
  {
    "_id": "alex123_2024-06-03",
    "usuario_id": "alex123",
    "fecha": "2024-06-03",
    "total_calorias": 150,
    "comidas": [
      {
        "tipo": "desayuno",
        "hora": "07:30:00",
        "alimentos": [
          {
            "nombre": "avena",
            "calorias": 150,
            "proteinas": 5,
            "peso": 250
          }
        ]
      }
    ]
  }
]


*/