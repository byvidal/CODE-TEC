# Guía de Mantenimiento y Mejores Prácticas - PDA

## Ejecución del Proyecto

### Modo Desarrollo
```bash
npm run dev
```
Ejecuta el servidor con reinicio automático cuando hay cambios en los archivos.

### Modo Producción
```bash
npm start
```

## Estructura del Proyecto

```
src/
├── server.js              # Servidor Express principal
├── routes/
│   └── api.js            # Rutas de API
├── services/
│   ├── weatherService.js      # Datos climáticos (Open-Meteo)
│   ├── cropService.js         # Catálogo de cultivos (Perenual/Local)
│   ├── recommendationService.js # Lógica de recomendaciones
│   └── pdfService.js          # Generación de reportes PDF
└── utils/
    └── soil.js           # Perfiles de suelo y coeficientes
```

## Variables de Entorno

Crear `.env` en la raíz del proyecto:

```bash
PORT=3000
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
PERENUAL_API_URL=https://perenual.com/api/v2
PERENUAL_API_KEY=              # Opcional: tu API key de Perenual
```

## API Endpoints

### GET /api/health
Estado del servidor

**Respuesta:**
```json
{
  "ok": true,
  "app": "PDA",
  "timestamp": "2026-05-06T10:30:00.000Z"
}
```

### GET /api/soil-types
Tipos de suelo disponibles

### GET /api/crops
Lista de cultivos disponibles

### GET /api/weather?latitude=19.4326&longitude=-99.1332
Clima actual y pronóstico

**Parámetros:**
- `latitude` (required): Latitud (-90 a 90)
- `longitude` (required): Longitud (-180 a 180)

### POST /api/recommendations
Genera una recomendación agrícola personalizada

**Body:**
```json
{
  "latitude": 19.4326,
  "longitude": -99.1332,
  "soilType": "franco",
  "fertilityLevel": "bueno",
  "landSizeHa": 1.5
}
```

### POST /api/reports/pdf
Genera un reporte PDF (mismos parámetros que /recommendations)

---

## Validaciones Implementadas

### Entrada de Datos
- ✅ Coordenadas dentro de rangos válidos (-90 a 90, -180 a 180)
- ✅ Tamaño del terreno > 0
- ✅ Coeficientes dentro de rango (0-1)
- ✅ Parámetros obligatorios validados

### Datos Climáticos
- ✅ Filtrado de valores NaN en precipitación
- ✅ Validación de respuesta de Open-Meteo
- ✅ Fallback a valores por defecto si falta información

### Cultivos
- ✅ Fallback automático si Perenual falla
- ✅ Validación de perfiles locales
- ✅ Manejo de errores con logging

---

## Mejores Prácticas Aplicadas

### Código Limpio
- Variables descriptivas
- Funciones pequeñas y enfocadas
- Documentación JSDoc completa
- Comentarios en lógica compleja

### Manejo de Errores
- Try-catch en operaciones asincrónicas
- Validaciones en entrada de datos
- Mensajes de error informativos
- Logging en consola para debugging

### Performance
- Promise.all para operaciones paralelas
- Promise.allSettled para fallos parciales
- Caché de resultados en frontend
- Evitar cálculos redundantes

### Seguridad
- Validación de entrada en servidor
- Sanitización de datos
- CORS habilitado
- Sin exposición de datos sensibles

---

## Debugging

### Logs en Terminal
El servidor registra:
- Errores en endpoints
- Fallos de API externas
- Cambios de estado
- Warnings de perfiles faltantes

### Console del Navegador
El frontend registra:
- Errores de API
- Validaciones fallidas
- Detalles de descarga de PDF

### Archivo de Logs
- `server.log`: Logs normales
- `server.err.log`: Errores del servidor

---

## Extendibilidad

### Agregar Nuevo Cultivo
1. Editar `src/data/crops.js`
2. Agregar objeto con estructura:
```javascript
{
  id: "nuevo-cultivo",
  name: "Nuevo Cultivo",
  optimalConditions: {
    temperatureMin: 15,
    temperatureMax: 30,
    humidityMin: 40,
    humidityMax: 80,
    soilTypes: ["franco", "limoso"]
  },
  waterRequirement: "500-700 mm",
  growthTimeDays: 100,
  theoreticalYieldTonHa: 8,
  care: ["Cuidado 1", "Cuidado 2"]
}
```

### Agregar Nuevo Tipo de Suelo
1. Editar `src/utils/soil.js`
2. Agregar a `soilProfiles`

### Modificar Coeficientes
- Clima: `recommendationService.js` - función `classifyClimate()`
- Suelo: `utils/soil.js` - objeto `soilProfiles`

---

## Problemas Comunes

### "PERENUAL_API_KEY no configurada"
**Solución:** Es normal. El sistema usa catálogo local automáticamente.

### Coordenadas inválidas
**Solución:** Usar formato decimal (ej: 19.4326, -99.1332)

### PDF vacío
**Solución:** Verificar que los datos de entrada sean válidos

### El servidor no inicia
**Solución:** Verificar que puerto 3000 está disponible o cambiar en `.env`

---

## Testing Manual

1. **Clima:**
   - GET /api/weather?latitude=19.4326&longitude=-99.1332

2. **Recomendación:**
   - POST /api/recommendations con datos válidos

3. **PDF:**
   - Generar recomendación
   - Descargar PDF desde interfaz

4. **Validaciones:**
   - Enviar coordenadas fuera de rango
   - Enviar terreno con -1 hectáreas
   - Omitir parámetros obligatorios

---

## Mantenimiento Futuro

- [ ] Actualizar datos de Perenual mensualmente
- [ ] Monitorear logs de errores
- [ ] Revisar y actualizar coeficientes anualmente
- [ ] Agregar más cultivos según región
- [ ] Implementar base de datos para históricos

---

**Última actualización:** 2026-05-06  
**Versión:** 1.0.0  
**Estado:** Producción
