const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;



// Middleware para procesar JSON
app.use(express.json({ limit: '5mb' })); //Permite que el servidor reciba JSON con un tamaño máximo de 5MB.

// Middleware para procesar datos binarios (imágenes)
app.use('/upload', express.raw({ type: 'application/octet-stream', limit: '10mb' })); //Permite recibir datos binarios (como imágenes) de hasta 10MB en la ruta /upload.



// 📌 Ruta para recibir imágenes en binario
app.post('/upload', (req, res) => {
    const imageID = req.headers['x-image-id']; // Leer el ID desde la cabecera
    const fileName = `image_${imageID}.jpg`; // Guardar la imagen con su identificador
    const filePath = path.join(__dirname, fileName);
  
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