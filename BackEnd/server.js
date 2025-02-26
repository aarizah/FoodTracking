const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
let hardware_data={}; //Variable para guardar los datos del hardware que llegan al servidor
let hardware_data_openai=[{peso:0,id:0},{peso:0,id:0}]; //Variable para guardar los datos que se envian a OpenAI
let hardware_data_procesado=[]; //Variable para guardar el historico de los datos


// Middleware para procesar JSON
app.use(express.json({ limit: '5mb' })); //Permite que el servidor reciba JSON con un tamaño máximo de 5MB.

// Middleware para procesar datos binarios (imágenes)
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '10mb' })); //Permite recibir datos binarios (como imágenes) de hasta 10MB en la ruta /upload.



// 📌 Ruta para recibir imágenes en binario
app.post('/upload', (req, res) => {
    const imageID = req.headers['x-image-id']; // Leer el ID desde la cabecera
    const priorID = req.headers['x-id-prior']; // Leer el ID desde la cabecera
    // Obtener la fecha actual en formato YYYYMMDD
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    // Construir el nombre del archivo
    const fileName = `image_${priorID}_${imageID}_${formattedDate}.jpg`;
    
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
    hardware_data=(req.body);
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "El JSON recibido está vacío" });
  }

  res.json({ message: "JSON recibido y procesado"});
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
    
    if (peso<5){
        // imagen a carpeta de descarte
        const origen = path.join(__dirname, "Images", "sin_procesar");
        const destino = path.join(__dirname, "Images", "descarte");
        moverImagenes(origen, destino, `image_${id}`);
    }
    else{

      

        const carpeta = path.join(__dirname, "Images", "openAI");

        fs.readdir(carpeta, (_, archivos) => {
            const cantidad = archivos.length;
            console.log(`Cantidad de imágenes encontradas: ${cantidad}`);
            if (cantidad === 0) {
                //imagen a carpeta de chatGPT
                const origen = path.join(__dirname, "Images", "sin_procesar");
                const destino = path.join(__dirname, "Images", "openAI");
                moverImagenes(origen, destino, `image_${id}`);
                hardware_data_openai[0].peso=peso;
                hardware_data_openai[0].id=id;

            } else if (cantidad === 1) {
                //imagen a carpeta de chatGPT
                const origen = path.join(__dirname, "Images", "sin_procesar");
                const destino = path.join(__dirname, "Images", "openAI");
                moverImagenes(origen, destino, `image_${id}`);
                hardware_data_openai[1].peso=peso;
                hardware_data_openai[1].id=id;
            } else {
                console.log("Hay dos o más imágenes.");
                hardware_data.push
            }
        });

        
    
    }
    hardware_data_procesado.push(json);//dato a historico
}

function moverImagenes(carpetaOrigen, carpetaDestino,criterio){
// Definir carpetas
//const carpetaOrigen = 'ruta/a/la/carpeta/origen';  // Cambia esto a tu carpeta origen
//const carpetaDestino = 'ruta/a/la/carpeta/destino'; // Cambia esto a tu carpeta destino

// Asegurar que la carpeta de destino exista
if (!fs.existsSync(carpetaDestino)) {
    fs.mkdirSync(carpetaDestino, { recursive: true });
}

// Criterio: mover archivos que contengan "imagen" en el nombre
fs.readdir(carpetaOrigen, (err, archivos) => {
    if (err) {
        console.error('Error al leer la carpeta:', err);
        return;
    }

    archivos.forEach(archivo => {
        if (archivo.includes(criterio)) { // Cambia esto según tu criterio
            const rutaOrigen = path.join(carpetaOrigen, archivo);
            const rutaDestino = path.join(carpetaDestino, archivo);

            // Mover archivo
            fs.rename(rutaOrigen, rutaDestino, (err) => {
                if (err) {
                    console.error(`Error al mover el archivo ${archivo}:`, err);
                } else {
                    console.log(`Archivo movido: ${archivo}`);
                }
            });
        }
    });
});
}


