const express = require('express');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai'); // Usando el SDK oficial

const app = express();
const port = 3000;
let hardware_data={}; //Variable para guardar los datos del hardware que llegan al servidor
let hardware_data_openai=[{peso:0,id:0},{peso:0,id:0}]; //Variable para guardar los datos que se envian a OpenAI


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
  hardware_data=(req.body);
  procesar_datos(hardware_data);
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



function procesar_datos(json){    
    let peso = json.weight;
    let id = json.id;
    let id_prior = json.ID_prior;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

    if (peso<5){


        // imagen a carpeta de descarte
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "descarte");

        moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
    }
    else{
      if (id_prior==0){
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "procesadas");
        moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);

      }     
      else {
        const carpeta = path.join(__dirname, "Images", "openAI");
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "openAI");
        fs.readdir(carpeta, (_, archivos) => {
            const cantidad = archivos.length;
            console.log(`Cantidad de imágenes encontradas: ${cantidad}`);
            if (cantidad === 0) {
                //imagen a carpeta de chatGPT
                moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
                hardware_data_openai.push({"peso":peso,"id":formattedDate});

            } else if (cantidad === 1) {
                //imagen a carpeta de chatGPT
                
                hardware_data_openai.push({"peso":peso,"id":formattedDate});

                // CALL OPEN AI API 
                // 🔹 EJEMPLO DE USO
                moverImagenes(origen, destino, `image_${id_prior}_${id}`, formattedDate)
                .then(() => {
                    return openAI_API(); // Llamar a la API solo después de que las imágenes se hayan movido
                })
                .then((resultado) => {
                    console.log("🍽️ Resultado:", resultado);
                })
                .catch((error) => {
                    console.error("❌ Error:", error);
                });
            
            } else {

                const carpetaOpenAI = path.join(__dirname, "Images", "openAI");
                const carpetaProcesados = path.join(__dirname, "Images", "procesadas");
                hardware_data_openai.shift();
                hardware_data_openai.push({"peso":peso,"id":formattedDate});
                moverImagenes(origen, destino, `image_${id_prior}_${id}`, formattedDate)
                .then(() => {
                    return openAI_API(); // Llamar a la API solo después de que las imágenes se hayan movido
                })
                .then((resultado) => {
                    console.log("🍽️ Resultado:", resultado);
                })
                .catch((error) => {
                    console.error("❌ Error:", error);
                });
                moverImagenMasAntigua(carpetaOpenAI, carpetaProcesados);
            }
        });

      } 
    
    }
    const json_procesado = {"id":formattedDate,"peso":peso,"id_prior":id_prior};
    guardarHistorico(json_procesado);
}

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


function moverImagenMasAntigua(origen, destino) {
    // Leer la carpeta de origen
    fs.readdir(origen, (err, archivos) => {
        if (err) {
            console.error('Error al leer la carpeta:', err);
            return;
        }

        if (archivos.length === 0) {
            console.log('No hay imágenes en la carpeta origen.');
            return;
        }

        // 📌 Obtener la imagen más antigua
        let imagenMasAntigua = archivos
            .map(archivo => ({
                nombre: archivo,
                tiempo: fs.statSync(path.join(origen, archivo)).mtime.getTime() // Obtener fecha de modificación
            }))
            .sort((a, b) => a.tiempo - b.tiempo)[0]; // Ordenar por fecha y tomar la más antigua

        if (!imagenMasAntigua) {
            console.log('No se encontró ninguna imagen.');
            return;
        }

        const rutaOrigen = path.join(origen, imagenMasAntigua.nombre);
        const rutaDestino = path.join(destino, imagenMasAntigua.nombre);

        // 📌 Asegurar que la carpeta de destino exista
        if (!fs.existsSync(destino)) {
            fs.mkdirSync(destino, { recursive: true });
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
}



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
                        - **porcentaje**: Porcentaje del peso total que aporta ese alimento (la suma de todos los porcentajes debe ser 100%).
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


