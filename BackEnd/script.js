const fs = require("fs");
const filePath = "./datos.json";
const fecha=obtenerFecha();

const data = fs.readFileSync(filePath, "utf8"); // Leer el archivo
let datos= JSON.parse(data); // Convertir a objeto de JS

function guardarDatos() {
    fs.writeFileSync(filePath, JSON.stringify(datos, null, 2), "utf8");
};

function obtenerFecha(){
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, "0"); // Mes en 2 dígitos
    const day = String(hoy.getDate()).padStart(2, "0"); // Día en 2 dígitos
    return `${month}-${day}`;
}


function NuevaComida(nueva_comida,peso_total){
    
    nueva_comida.forEach(element => {element.peso=peso_total
    });
    
    if (!datos[0].registro[fecha]) {
        datos[0].registro[fecha]=[];
    }
    datos[0].registro[fecha].push(nueva_comida);
}

function ObtenerResumenDiario(){
    let calorias_ac = 0, proteinas_ac = 0, grasas_ac = 0, carbohidratos_ac = 0,
    fibra_ac = 0, hierro_ac = 0, calcio_ac = 0, vitamina_d_ac = 0,
    magnesio_ac = 0, zinc_ac = 0, vitamina_c_ac = 0, omega3_ac = 0;
    
    for (let array of datos[0].registro[fecha]){
        for(let object of array){
        calorias_ac+=object.calorias*object.peso*object.porcentaje/10000; 
        console.log(calorias_ac);
        proteinas_ac += object.proteinas*object.peso*object.porcentaje/10000;
        grasas_ac += object.grasas*object.peso*object.porcentaje/10000;
        carbohidratos_ac += object.carbohidratos*object.peso*object.porcentaje/10000;
        fibra_ac += object.fibra*object.peso*object.porcentaje/10000;
        hierro_ac += object.hierro*object.peso*object.porcentaje/10000;
        calcio_ac += object.calcio*object.peso*object.porcentaje/10000;
        vitamina_d_ac += object.vitamina_d*object.peso*object.porcentaje/10000;
        magnesio_ac += object.magnesio*object.peso*object.porcentaje/10000;
        zinc_ac += object.zinc*object.peso*object.porcentaje/10000;
        vitamina_c_ac += object.vitamina_c*object.peso*object.porcentaje/10000;
        omega3_ac += object.omega3*object.peso*object.porcentaje/10000;
        }
    }
    const consumo_actual = {
        calorias: calorias_ac,
        proteinas: proteinas_ac,
        grasas: grasas_ac,
        carbohidratos: carbohidratos_ac,
        fibra: fibra_ac,
        hierro: hierro_ac,
        calcio: calcio_ac,
        vitamina_d: vitamina_d_ac,
        magnesio: magnesio_ac,
        zinc: zinc_ac,
        vitamina_c: vitamina_c_ac,
        omega3: omega3_ac
    };

    const diferencia = {
        calorias: datos[0].objetivos.calorias - calorias_ac,
        proteinas: datos[0].objetivos.proteinas - proteinas_ac,
        grasas: datos[0].objetivos.grasas - grasas_ac,
        carbohidratos: datos[0].objetivos.carbohidratos - carbohidratos_ac,
        fibra: datos[0].objetivos.fibra - fibra_ac,
        hierro: datos[0].objetivos.hierro - hierro_ac,
        calcio: datos[0].objetivos.calcio - calcio_ac,
        vitamina_d: datos[0].objetivos.vitamina_d - vitamina_d_ac,
        magnesio: datos[0].objetivos.magnesio - magnesio_ac,
        zinc: datos[0].objetivos.zinc - zinc_ac,
        vitamina_c: datos[0].objetivos.vitamina_c - vitamina_c_ac,
        omega3: datos[0].objetivos.omega3 - omega3_ac
    };

    console.log("📊 Has consumido:");
    console.table(consumo_actual);

    console.log("📊 Te hace falta consumir:");
    console.table(diferencia);

    
}


comida1=[
    {
      "nombre": "huevo frito",
      "porcentaje": 40,
      "calorias": 143,
      "grasas": 10,
      "proteinas": 13,
      "carbohidratos": 1,
      "fibra": 0,
      "hierro": 1.75,
      "calcio": 56,
      "vitamina_d": 2,
      "magnesio": 12,
      "zinc": 1.3,
      "vitamina_c": 0,
      "omega3": 0.04,
      "biotina_b7": 25
    },
    {
      "nombre": "arepa de maíz",
      "porcentaje": 30,
      "calorias": 219,
      "grasas": 4,
      "proteinas": 5,
      "carbohidratos": 44,
      "fibra": 5,
      "hierro": 1.5,
      "calcio": 10,
      "vitamina_d": 0,
      "magnesio": 37,
      "zinc": 0.6,
      "vitamina_c": 0,
      "omega3": 0,
      "biotina_b7": 0
    },
    {
      "nombre": "queso fresco",
      "porcentaje": 30,
      "calorias": 270,
      "grasas": 22,
      "proteinas": 18,
      "carbohidratos": 2,
      "fibra": 0,
      "hierro": 0.2,
      "calcio": 500,
      "vitamina_d": 0,
      "magnesio": 25,
      "zinc": 2.7,
      "vitamina_c": 0,
      "omega3": 0.1,
      "biotina_b7": 5
    }
  ]
;  

//NuevaComida(comida,peso_total);
NuevaComida(comida1,203)
//guardarDatos();
//console.log(datos[0].registro[fecha][0]);
ObtenerResumenDiario();

