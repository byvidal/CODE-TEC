# Greenhouse Monitor

Prototipo de sistema de adquisición de datos, telemetría y teleprocesos para invernaderos.
El backend recibe datos simulados de Wokwi o de un simulador Node.js, los procesa y persiste, para un futuro dashboard.

## Requisitos
- Node.js 20+

## Instalación
```bash
npm install
```

## Inicialización
```bash
npm run db:reset
```

## Ejecución
```bash
npm start
```
El servidor correrá en http://localhost:3000.

## Simulación de Telemetría
```bash
npm run simulator:normal
npm run simulator:dry
npm run simulator:heat
npm run simulator:low-water
npm run simulator:disconnect
```

## Pruebas
```bash
npm test
```

## Limitaciones
- Los sensores son simulados.
- Las suscripciones utilizan un modelo mock.
