<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Coverage-74%25-yellow" alt="Coverage" />
</p>

# Songs Service Microservice

Este microservicio es el encargado de la gestión de canciones. Su responsabilidad abarca la administración y entrega por streaming de canciones, hasta el procesamiento y almacenamiento de los archivos de audio y video.

## 🧪 Estrategia de Testing

El proyecto utiliza testings de integración y unitarios. Los testings de integración son realizados con Cucumber y los testings unitarios con Jest.

### Business Modules (Integración)
Para los módulos de negocio, utilizamos **Cucumber**. Esto nos permite definir pruebas de integración basadas en comportamiento (BDD) que verifican que los flujos completos de la aplicación funcionen como se espera.

- **Herramienta:** Cucumber
- **Ubicación:** `test/`
- **Comando:** `npm run test:e2e`

### Tools & Utils (Unitarios)
Para las herramientas internas, helpers y utilidades que no dependen directamente de la lógica de negocio compleja o bases de datos, utilizamos **Jest** para pruebas unitarias rápidas y aisladas.

- **Herramienta:** Jest
- **Ubicación:** `src/**/*.spec.ts`
- **Comando:** `npm run test`

### Coverage Combinado
Contamos con un mecanismo para unificar el reporte de coverage de ambas herramientas.
- **Comando:** `npm run test:cov:all`

## 🛡️ Calidad y CI/CD

### Husky
Utilizamos **Husky** para gestionar nuestros Git Hooks. Esto asegura que antes de cada commit o push, el código cumpla con los estándares de calidad definidos (linting, formatting), evitando que código con errores llegue al repositorio.

### Integración Continua
Nuestro pipeline de CI en GitHub Actions se encarga de:
1. Validar el código (Linting).
2. Ejecutar la suite completa de tests.
3. Generar el reporte de cobertura combinado.
4. Actualizar automáticamente el badge de coverage en este README.

## 🚀 Ejecución Local

Para correr el proyecto en local, hay que seguir estos pasos:

### 1. Prerrequisitos
- Node.js (versión 22 recomendada)
- Docker para levantar el servicio de MongoDB.

### 2. Instalación
Instala las dependencias del proyecto:
```bash
npm install
```

### 3. Variables de Entorno
Asegúrate de tener un archivo `.env` configurado en la raíz del proyecto con las variables necesarias (DB URL, Credenciales de Firebase, etc.).

### 4. Iniciar el Servidor

```bash
docker compose up -d

# Modo desarrollo (con watch)
npm run start:dev

# Modo producción
npm run start:prod
```

El servicio estará disponible en `http://localhost:3000` (o el puerto configurado).
