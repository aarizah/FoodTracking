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
  if (!req.body || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'No se recibieron datos binarios.' });
  }

  const fileName = `image_${Date.now()}.jpg`;
  const filePath = path.join(__dirname, fileName);


  fs.writeFile(filePath, req.body, (err) => { // Función para guardar la imagen. fs.writeFile
    if (err) {
      console.error("Error al guardar la imagen:", err);
      return res.status(500).json({ error: 'Error al guardar la imagen.' });
    }
    console.log(`📸 Imagen guardada: ${fileName}`);
    res.json({ message: 'Imagen recibida y guardada.', fileName });
  });

});




// 📌 Nueva ruta para recibir JSON
app.post('/json', (req, res) => {
  console.log("📩 JSON recibido:", req.body);

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "El JSON recibido está vacío" });
  }

  console.log("✅ JSON procesado");

  res.json({ message: "JSON recibido y procesado"});
});


// 📌 Nueva ruta para recibir Strings // Aca se inicializa el middleware
app.post('/string', express.text({ type: 'text/plain', limit: '2mb' }), (req, res) => {
    console.log("📩 String recibido:", req.body);
  
    if (!req.body || req.body.trim().length === 0) {
      return res.status(400).json({ error: "El string recibido está vacío" });
    }
  
    console.log("✅ String procesado");
  
    res.json({ message: "String recibido y procesado" });
  });
  


// Iniciar el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});