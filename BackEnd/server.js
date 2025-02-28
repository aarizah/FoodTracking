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
                hardware_data_openai[0].peso=peso;
                hardware_data_openai[0].id=id;

            } else if (cantidad === 1) {
                //imagen a carpeta de chatGPT
                moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
                hardware_data_openai[1].peso=peso;
                hardware_data_openai[1].id=id;
            } else {
                moverImagenes(origen, destino, `image_${id_prior}_${id}`,formattedDate);
                const carpetaOpenAI = path.join(__dirname, "Images", "openAI");
                const carpetaProcesados = path.join(__dirname, "Images", "procesadas");
                moverImagenMasAntigua(carpetaOpenAI, carpetaProcesados);
            }
        });

      } 
    
    }
    const json_procesado = {"id":formattedDate,"peso":peso,"id_prior":id_prior};
    hardware_data_procesado.push(json_procesado);//dato a historico
}

function moverImagenes(carpetaOrigen, carpetaDestino,criterio,nuevoNombre){
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
            const extension = path.extname(archivo); // Obtener la extensión (.jpg, .png, etc.)
            const nuevoArchivo = `${nuevoNombre}${extension}`; // Renombrar con el ID único
            const rutaOrigen = path.join(carpetaOrigen, archivo);
            const rutaDestino = path.join(carpetaDestino, nuevoArchivo);

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



