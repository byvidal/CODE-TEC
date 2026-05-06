# PDA (Plataforma de Apoyo Agricola)

Aplicacion web de hackaton para agricultores. Genera recomendaciones de cultivo, plan agricola y estimaciones de produccion usando geolocalizacion, clima real de Open-Meteo y datos de cultivos.

## Funcionalidades

- Geolocalizacion desde el navegador.
- Clima actual y pronostico basico con Open-Meteo.
- Seleccion manual de tipo y fertilidad de suelo.
- Integracion opcional con API de cultivos FgFarm mediante variables de entorno.
- Catalogo local de cultivos como respaldo.
- Reglas de recomendaciones agricolas.
- Plan automatico de riego, fertilizacion y cuidados.
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
FGFARM_API_URL=
FGFARM_API_KEY=
```

Open-Meteo no requiere API key para esta implementacion. `FGFARM_API_URL` y `FGFARM_API_KEY` son opcionales; si fallan o no existen, se usa el catalogo local.

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
