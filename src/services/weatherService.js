const BASE_URL = process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1/forecast";

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

async function getWeather(latitudeInput, longitudeInput) {
  const { latitude, longitude } = assertCoordinates(latitudeInput, longitudeInput);
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
    throw new Error(`Open-Meteo respondio con estado ${response.status}.`);
  }

  const payload = await response.json();
  const nextRainProbabilities = payload.hourly?.precipitation_probability?.slice(0, 12) || [];
  const nextHumidity = payload.hourly?.relative_humidity_2m?.slice(0, 12) || [];
  const rainProbability = Math.round(Math.max(...nextRainProbabilities.filter(Number.isFinite), 0));
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
