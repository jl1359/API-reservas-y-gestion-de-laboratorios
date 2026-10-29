export interface LaboratorioSeedData {
  nombre: string;
  carreraNombre: string;
  capacidad: number;
  ubicacion: string;
  latitud: number;
  longitud: number;
  reservaPorComputadora: boolean;
  imagenUrl: string;
}

export const LABORATORIOS_REALES_FCYT: LaboratorioSeedData[] = [
  // ==========================================
  // BLOQUE 1: LABORATORIOS ESPECIALIZADOS (14)
  // ==========================================
  {
    nombre: 'Centro de Investigacion y Desarrollo Industrial (CIDI)',
    carreraNombre: 'Ingenieria Industrial',
    capacidad: 25,
    ubicacion: 'Bloque Industrial, Campus Central',
    latitud: -17.3938,
    longitud: -66.1456,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-23-at-11.41.45-1.jpeg'
  },
  {
    nombre: 'Centro de Investigacion y Tecnologia de Materiales (CITEMA)',
    carreraNombre: 'Ingenieria Quimica',
    capacidad: 20,
    ubicacion: 'Edificio de Quimica, Planta Baja, Campus Central',
    latitud: -17.3934,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },
  {
    nombre: 'Laboratorio de Automatizacion y Control (LACME)',
    carreraNombre: 'Ingenieria Electromecanica',
    capacidad: 24,
    ubicacion: 'Bloque de Mecanica y Electromecanica, Campus Central',
    latitud: -17.3941,
    longitud: -66.1462,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Autimatizacion.jpg'
  },
  {
    nombre: 'Laboratorio de CAD/CAM/CNC',
    carreraNombre: 'Ingenieria Mecanica',
    capacidad: 30,
    ubicacion: 'Edificio CAD-CAM, Campus Central',
    latitud: -17.3942,
    longitud: -66.1464,
    reservaPorComputadora: true,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Adobe-Express-file.png'
  },
  {
    nombre: 'Laboratorio de Energia',
    carreraNombre: 'Ingenieria Electromecanica',
    capacidad: 20,
    ubicacion: 'Bloque de Electromecanica, Campus Central',
    latitud: -17.3940,
    longitud: -66.1463,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Energia.jpg'
  },
  {
    nombre: 'Laboratorio de Ensayos No Destructivos y Soldadura (LENDSOL)',
    carreraNombre: 'Ingenieria Mecanica',
    capacidad: 18,
    ubicacion: 'Bloque de Talleres Mecanicos, Campus Central',
    latitud: -17.3943,
    longitud: -66.1466,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Ensayos-no-destructivos.jpg'
  },
  {
    nombre: 'Laboratorio de Ingenieria Automotriz',
    carreraNombre: 'Ingenieria Mecanica',
    capacidad: 20,
    ubicacion: 'Bloque de Automotriz, Campus Central',
    latitud: -17.3944,
    longitud: -66.1465,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/automotriz.jpg'
  },
  {
    nombre: 'Laboratorio de Materiales',
    carreraNombre: 'Ingenieria Mecanica',
    capacidad: 20,
    ubicacion: 'Bloque de Mecanica, Campus Central',
    latitud: -17.3941,
    longitud: -66.1461,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/labo-de-materiales.jpg'
  },
  {
    nombre: 'Laboratorio de Metrologia, Calibracion y Mantenimiento',
    carreraNombre: 'Ingenieria Electromecanica',
    capacidad: 18,
    ubicacion: 'Campus Quillacollo - Complejo PDTF',
    latitud: -17.3985,
    longitud: -66.2755,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/metrologia.jpg'
  },
  {
    nombre: 'Laboratorio de No Metalicos y Nanoestructurados',
    carreraNombre: 'Ingenieria Quimica',
    capacidad: 16,
    ubicacion: 'Edificio de Quimica, Campus Central',
    latitud: -17.3935,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/unidad-no-metalicos.png'
  },
  {
    nombre: 'Laboratorio de Pavimentos y Asfaltos (LAP)',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 22,
    ubicacion: 'Edificio de Laboratorios Basicos, Parque La Torre',
    latitud: -17.3929,
    longitud: -66.1452,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/labo-de-pavimentos.jpg'
  },
  {
    nombre: 'Laboratorio de Refrigeracion y Aire Acondicionado',
    carreraNombre: 'Ingenieria Electromecanica',
    capacidad: 20,
    ubicacion: 'Edificio CAD-CAM, Campus Central',
    latitud: -17.3942,
    longitud: -66.1463,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/LR.png'
  },
  {
    nombre: 'Laboratorio de Resistencia de Materiales (LRM)',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 25,
    ubicacion: 'Edificio de Laboratorios Basicos, Parque La Torre',
    latitud: -17.3928,
    longitud: -66.1451,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/lab-resistencias.jpg'
  },
  {
    nombre: 'Laboratorio de Chagas e Inmunoparasitologia',
    carreraNombre: 'Licenciatura en Biologia',
    capacidad: 16,
    ubicacion: 'Bloque de Biologia, Campus Central',
    latitud: -17.3932,
    longitud: -66.1468,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/lab-chagas.jpg'
  },

  // ========================================================
  // BLOQUE 2: CENTROS DE INVESTIGACION Y LABORATORIOS (13)
  // ========================================================
  {
    nombre: 'Centro de Aguas y Saneamiento Ambiental (CASA)',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 25,
    ubicacion: 'Edificio CASA, Campus Central',
    latitud: -17.3930,
    longitud: -66.1460,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CENTRO-DE-AGUA1.jpg'
  },
  {
    nombre: 'Centro de Alimentos y Productos Naturales (CAPN)',
    carreraNombre: 'Ingenieria de Alimentos',
    capacidad: 24,
    ubicacion: 'Edificio de Alimentos, Campus Central',
    latitud: -17.3933,
    longitud: -66.1462,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/09/images.png'
  },
  {
    nombre: 'Centro de Biodiversidad y Genetica (CBG)',
    carreraNombre: 'Licenciatura en Biologia',
    capacidad: 20,
    ubicacion: 'Bloque de Biologia, Campus Central',
    latitud: -17.3931,
    longitud: -66.1469,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/biodiversidad-4.jpeg'
  },
  {
    nombre: 'Centro de Biotecnologia (CBT)',
    carreraNombre: 'Licenciatura en Biologia',
    capacidad: 20,
    ubicacion: 'Bloque de Biologia y Biotecnologia, Campus Central',
    latitud: -17.3932,
    longitud: -66.1471,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/10/cbt-nueva-scaled.png'
  },
  {
    nombre: 'Centro de Mejoramiento Ensenanza Matematica e Inf. (CEMM)',
    carreraNombre: 'Licenciatura en Matematicas',
    capacidad: 35,
    ubicacion: 'Edificio MEMI / Matematicas, Campus Central',
    latitud: -17.3937,
    longitud: -66.1453,
    reservaPorComputadora: true,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CMEMI.jpg'
  },
  {
    nombre: 'Centro de Tecnologia Agroindustrial (CTA)',
    carreraNombre: 'Ingenieria de Alimentos',
    capacidad: 22,
    ubicacion: 'Bloque Agroindustrial, Campus Central',
    latitud: -17.3934,
    longitud: -66.1463,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/09/images-2.jpeg'
  },
  {
    nombre: 'Centro Universitario de Investigaciones en Energias (CUIE)',
    carreraNombre: 'Ingenieria Electrica',
    capacidad: 20,
    ubicacion: 'Bloque de Investigacion Energetica, Campus Central',
    latitud: -17.3940,
    longitud: -66.1460,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CUIE.jpg'
  },
  {
    nombre: 'Laboratorio de Geotecnia (Mecanica de Suelos y Rocas)',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 24,
    ubicacion: 'Edificio de Ingenieria Civil, Campus Central',
    latitud: -17.3936,
    longitud: -66.1450,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/10-scaled.png'
  },
  {
    nombre: 'Laboratorio de Hidraulica (LH - CIRH)',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 25,
    ubicacion: 'Bloque de Hidraulica, Campus Central',
    latitud: -17.3937,
    longitud: -66.1449,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Labo-Hidraulica.jpg'
  },
  {
    nombre: 'Programa de Desarrollo Tecnologias de Fabricacion (PDTF)',
    carreraNombre: 'Ingenieria Mecanica',
    capacidad: 30,
    ubicacion: 'Campus Quillacollo - Talleres PDTF',
    latitud: -17.3985,
    longitud: -66.2755,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/PDTF.jpg'
  },
  {
    nombre: 'Programa ELEKTRO - Laboratorio de Investigacion Electrica',
    carreraNombre: 'Ingenieria Electrica',
    capacidad: 20,
    ubicacion: 'Bloque de Electrica y Electronica, Campus Central',
    latitud: -17.3939,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/elektro.jpg'
  },
  {
    nombre: 'Unidad de Limnologia y Recursos Acuaticos (ULRA)',
    carreraNombre: 'Licenciatura en Biologia',
    capacidad: 18,
    ubicacion: 'Bloque de Biologia, Campus Central',
    latitud: -17.3933,
    longitud: -66.1470,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/urlss.png'
  },
  {
    nombre: 'Centro de Investigacion en Tecnologia Aplicada (CITA)',
    carreraNombre: 'Ingenieria Industrial',
    capacidad: 25,
    ubicacion: 'Edificio CITA, Campus Central',
    latitud: -17.3939,
    longitud: -66.1455,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/10/images-1.png'
  },

  // ========================================================
  // BLOQUE 3: LABORATORIOS DEPARTAMENTALES DE DOCENCIA (18)
  // ========================================================
  // 3.1 Departamento de Informatica y Sistemas (3)
  {
    nombre: 'Laboratorio de Computo y Redes (DIS)',
    carreraNombre: 'Ingenieria de Sistemas',
    capacidad: 40,
    ubicacion: 'Edificio DIS, Planta Baja, Campus Central',
    latitud: -17.3936,
    longitud: -66.1454,
    reservaPorComputadora: true,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CMEMI.jpg'
  },
  {
    nombre: 'Laboratorio de Desarrollo de Software (CIDETSI)',
    carreraNombre: 'Ingenieria Informatica',
    capacidad: 30,
    ubicacion: 'Edificio DIS, Segundo Piso, Campus Central',
    latitud: -17.3936,
    longitud: -66.1454,
    reservaPorComputadora: true,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CMEMI.jpg'
  },
  {
    nombre: 'Laboratorio de Mantenimiento y Hardware (DIS)',
    carreraNombre: 'Ingenieria de Sistemas',
    capacidad: 25,
    ubicacion: 'Edificio DIS, Primer Piso, Campus Central',
    latitud: -17.3936,
    longitud: -66.1454,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/CMEMI.jpg'
  },

  // 3.2 Departamento de Fisica (5)
  {
    nombre: 'Laboratorio de Fisica Basica I (Mecanica)',
    carreraNombre: 'Licenciatura en Fisica',
    capacidad: 30,
    ubicacion: 'Edificio de Fisica, Planta Baja, Campus Central',
    latitud: -17.3937,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Autimatizacion.jpg'
  },
  {
    nombre: 'Laboratorio de Fisica Basica II (Termodinamica y Fluidos)',
    carreraNombre: 'Licenciatura en Fisica',
    capacidad: 30,
    ubicacion: 'Edificio de Fisica, Planta Baja, Campus Central',
    latitud: -17.3937,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Autimatizacion.jpg'
  },
  {
    nombre: 'Laboratorio de Fisica Basica III (Electricidad y Magnetismo)',
    carreraNombre: 'Licenciatura en Fisica',
    capacidad: 30,
    ubicacion: 'Edificio de Fisica, Primer Piso, Campus Central',
    latitud: -17.3937,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Autimatizacion.jpg'
  },
  {
    nombre: 'Laboratorio de Optica y Fisica Moderna',
    carreraNombre: 'Licenciatura en Fisica',
    capacidad: 20,
    ubicacion: 'Edificio de Fisica, Segundo Piso, Campus Central',
    latitud: -17.3937,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Autimatizacion.jpg'
  },
  {
    nombre: 'Centro de Monitoreo Climatico',
    carreraNombre: 'Licenciatura en Fisica',
    capacidad: 15,
    ubicacion: 'Edificio de Fisica, Azotea / Observatorio, Campus Central',
    latitud: -17.3937,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/Energia.jpg'
  },

  // 3.3 Departamento de Quimica (5)
  {
    nombre: 'Laboratorio de Quimica General',
    carreraNombre: 'Licenciatura en Quimica',
    capacidad: 32,
    ubicacion: 'Edificio de Quimica, Planta Baja, Campus Central',
    latitud: -17.3934,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },
  {
    nombre: 'Laboratorio de Quimica Organica',
    carreraNombre: 'Licenciatura en Quimica',
    capacidad: 25,
    ubicacion: 'Edificio de Quimica, Primer Piso, Campus Central',
    latitud: -17.3934,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },
  {
    nombre: 'Laboratorio de Fisicoquimica',
    carreraNombre: 'Licenciatura en Quimica',
    capacidad: 25,
    ubicacion: 'Edificio de Quimica, Segundo Piso, Campus Central',
    latitud: -17.3934,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },
  {
    nombre: 'Laboratorio de Quimica Analitica e Instrumental',
    carreraNombre: 'Licenciatura en Quimica',
    capacidad: 22,
    ubicacion: 'Edificio de Quimica, Segundo Piso, Campus Central',
    latitud: -17.3934,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },
  {
    nombre: 'Laboratorio de Operaciones Unitarias',
    carreraNombre: 'Ingenieria Quimica',
    capacidad: 25,
    ubicacion: 'Planta Piloto de Ingenieria Quimica, Campus Central',
    latitud: -17.3935,
    longitud: -66.1457,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/11-scaled.png'
  },

  // 3.4 Departamento de Electrica y Electronica (4)
  {
    nombre: 'Laboratorio de Circuitos Electricos y Medidas',
    carreraNombre: 'Ingenieria Electrica',
    capacidad: 25,
    ubicacion: 'Bloque de Electrica y Electronica, Planta Baja, Campus Central',
    latitud: -17.3939,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/elektro.jpg'
  },
  {
    nombre: 'Laboratorio de Electronica Analogica y Digital',
    carreraNombre: 'Ingenieria Electronica',
    capacidad: 25,
    ubicacion: 'Bloque de Electrica y Electronica, Primer Piso, Campus Central',
    latitud: -17.3939,
    longitud: -66.1458,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/elektro.jpg'
  },
  {
    nombre: 'Laboratorio de Telecomunicaciones y Redes',
    carreraNombre: 'Ingenieria Electronica',
    capacidad: 25,
    ubicacion: 'Bloque de Electrica y Electronica, Segundo Piso, Campus Central',
    latitud: -17.3939,
    longitud: -66.1458,
    reservaPorComputadora: true,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/elektro.jpg'
  },
  {
    nombre: 'Laboratorio de Maquinas Electricas y Potencia',
    carreraNombre: 'Ingenieria Electrica',
    capacidad: 20,
    ubicacion: 'Bloque de Maquinas Electricas, Campus Central',
    latitud: -17.3939,
    longitud: -66.1459,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/elektro.jpg'
  },

  // 3.5 Departamento de Ingenieria Civil (1)
  {
    nombre: 'Gabinete de Topografia y Geodesia',
    carreraNombre: 'Ingenieria Civil',
    capacidad: 25,
    ubicacion: 'Edificio de Ingenieria Civil, Planta Baja, Campus Central',
    latitud: -17.3936,
    longitud: -66.1450,
    reservaPorComputadora: false,
    imagenUrl: 'https://www.fcyt.umss.edu.bo/wp-content/uploads/2025/11/10-scaled.png'
  }
];
