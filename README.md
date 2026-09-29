# Greenhouse Monitor

Sistema de adquisición de datos, telemetría y teleprocesos para invernaderos inteligentes.
Recibe datos de sensores (simulados en Wokwi o Node.js), los valida, almacena, y los muestra en un dashboard en tiempo real. 
Genera alertas y simula el control de actuadores de forma automática o manual.

## Instalación

```bash
npm install
```

## Configuración y Ejecución

1. Inicializar la base de datos (SQLite):
   ```bash
   npm run db:seed
   ```
2. Iniciar el servidor backend y frontend:
   ```bash
   npm start
   ```
   (El servidor corre en http://localhost:3000)

## Simulación de Telemetría

Puedes enviar datos al servidor utilizando el simulador incluido en Node.js:
```bash
npm run simulator
```

También puedes usar **Wokwi** cargando los archivos de la carpeta `wokwi/`.

## Pruebas
```bash
npm test
```
