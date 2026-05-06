# PDA (Plataforma de Apoyo Agricola)

Aplicacion web de hackaton para agricultores. Genera recomendaciones de cultivo, plan agricola y estimaciones de produccion usando geolocalizacion, clima real de Open-Meteo y datos de cultivos.

## Funcionalidades

- Geolocalizacion desde el navegador.
- Selección de ubicación en mapa con geocodificación inversa (Nominatim/OpenStreetMap).
- Clima actual y pronostico basico con Open-Meteo.
- Selección manual de tipo y fertilidad de suelo.
- Integración opcional con API de plantas Perenual mediante variables de entorno.
- Catalogo local de cultivos como respaldo.
- Reglas de recomendaciones agricolas.
- Plan automatico de riego, fertilizacion y cuidados.
- Generacion de PDF con clima, cultivo, plan, recomendaciones y estimacion.
- Calculo de produccion:

```text
Produccion Total = Tamano del Terreno x (Rendimiento Teorico x Cc x Cf)
```

## Inicio rapido

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```bash
PORT=3000
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
PERENUAL_API_URL=https://perenual.com/api/v2
PERENUAL_API_KEY=
```

Open-Meteo no requiere API key para esta implementacion. Perenual requiere `PERENUAL_API_KEY`; si falla o no existe, se usa el catalogo local.
La geocodificación inversa utiliza Nominatim (OpenStreetMap) sin API key.

## Estructura

```text
src/
  server.js
  routes/
  services/
  data/
  utils/
public/
  index.html
  styles.css
  app.js
```
