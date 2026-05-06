const BASE_URL = process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1/forecast";

/**
 * Valida y convierte coordenadas geográficas
 * @param {number|string} latitude - Latitud (-90 a 90)
 * @param {number|string} longitude - Longitud (-180 a 180)
 * @returns {{latitude: number, longitude: number}} Coordenadas validadas
 * @throws {Error} Si las coordenadas son inválidas
 */
function assertCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitud y longitud son obligatorias.");
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Coordenadas fuera de rango.");
  }

  return { latitude: lat, longitude: lon };
}

/**
 * Calcula el promedio de valores válidos
 * @param {number[]} values - Array de valores numéricos
 * @returns {number} Promedio de valores válidos (0 si no hay valores)
 */
function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (!validValues.length) return 0;
  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

function summarizeForecast(daily) {
  if (!daily?.time?.length) {
    return [];
  }

  return daily.time.slice(0, 5).map((date, index) => ({
    date,
    temperatureMin: daily.temperature_2m_min?.[index] ?? null,
    temperatureMax: daily.temperature_2m_max?.[index] ?? null,
    rainProbability: daily.precipitation_probability_max?.[index] ?? null
  }));
}

/**
 * Obtiene el clima actual y pronóstico de 5 días usando Open-Meteo
 * @param {number|string} latitudeInput - Latitud del lugar
 * @param {number|string} longitudeInput - Longitud del lugar
 * @returns {Promise<{source: string, latitude: number, longitude: number, timezone: string, current: object, forecast: array}>} Datos climáticos
 * @throws {Error} Si la API no responde correctamente después de reintentos
 */
async function getWeather(latitudeInput, longitudeInput) {
  const { latitude, longitude } = assertCoordinates(latitudeInput, longitudeInput);
  
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchWeatherData(latitude, longitude);
    } catch (error) {
      lastError = error;
      
      // Si es error 502 o 429, reintentar con espera exponencial
      if (error.statusCode === 502 || error.statusCode === 429) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.warn(`Open-Meteo respondio con ${error.statusCode}. Reintentando en ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
      
      throw error;
    }
  }

  throw lastError || new Error("Error obteniendo datos de Open-Meteo");
}

async function fetchWeatherData(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,precipitation,rain",
    hourly: "precipitation_probability,relative_humidity_2m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "5"
  });

  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    const error = new Error(`Open-Meteo respondio con estado ${response.status}.`);
    error.statusCode = response.status;
    throw error;
  }

  const payload = await response.json();
  const nextRainProbabilities = payload.hourly?.precipitation_probability?.slice(0, 12) || [];
  const nextHumidity = payload.hourly?.relative_humidity_2m?.slice(0, 12) || [];
  const validRainProbs = nextRainProbabilities.filter(Number.isFinite);
  const rainProbability = Math.round(Math.max(...validRainProbs, 0));
  const humidity = payload.current?.relative_humidity_2m ?? Math.round(average(nextHumidity));

  return {
    source: "Open-Meteo",
    latitude,
    longitude,
    timezone: payload.timezone || "UTC",
    current: {
      temperature: payload.current?.temperature_2m ?? null,
      humidity,
      rainProbability,
      precipitation: payload.current?.precipitation ?? 0,
      rain: payload.current?.rain ?? 0
    },
    forecast: summarizeForecast(payload.daily)
  };
}

module.exports = {
  getWeather
};
