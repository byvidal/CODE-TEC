const { getSoilCoefficient } = require("../utils/soil");

/**
 * Calcula un puntaje de compatibilidad entre un cultivo y las condiciones actuales
 * @param {object} crop - Datos del cultivo
 * @param {object} weather - Datos climáticos actuales
 * @param {string} soilType - Tipo de suelo
 * @returns {number} Puntuación de 0-100
 */
function scoreCrop(crop, weather, soilType) {
  const { temperature, humidity } = weather.current;
  const optimal = crop.optimalConditions;
  let score = 0;

  if (temperature >= optimal.temperatureMin && temperature <= optimal.temperatureMax) {
    score += 45;
  } else {
    const distance = Math.min(
      Math.abs(temperature - optimal.temperatureMin),
      Math.abs(temperature - optimal.temperatureMax)
    );
    score += Math.max(0, 35 - distance * 3);
  }

  if (humidity >= optimal.humidityMin && humidity <= optimal.humidityMax) {
    score += 25;
  } else {
    const distance = Math.min(
      Math.abs(humidity - optimal.humidityMin),
      Math.abs(humidity - optimal.humidityMax)
    );
    score += Math.max(0, 20 - distance * 0.7);
  }

  if (optimal.soilTypes.includes(soilType)) {
    score += 25;
  }

  if (weather.current.rainProbability <= 70) {
    score += 5;
  }

  return Math.round(score);
}

/**
 * Clasifica el clima actual del lugar como ideal, medio o adverso
 * @param {object} crop - Datos del cultivo
 * @param {object} weather - Datos climáticos actuales
 * @returns {{label: string, coefficient: number}} Clasificación y coeficiente
 */
function classifyClimate(crop, weather) {
  const { temperature, humidity, rainProbability } = weather.current;
  const optimal = crop.optimalConditions;
  const tempIdeal = temperature >= optimal.temperatureMin && temperature <= optimal.temperatureMax;
  const humidityIdeal = humidity >= optimal.humidityMin && humidity <= optimal.humidityMax;
  const rainManageable = rainProbability <= 60;

  if (tempIdeal && humidityIdeal && rainManageable) {
    return {
      label: "clima ideal",
      coefficient: 1
    };
  }

  if (
    temperature >= optimal.temperatureMin - 5 &&
    temperature <= optimal.temperatureMax + 5 &&
    humidity >= optimal.humidityMin - 15 &&
    humidity <= optimal.humidityMax + 15
  ) {
    return {
      label: "condiciones medias",
      coefficient: 0.7
    };
  }

  return {
    label: "condiciones adversas",
    coefficient: 0.5
  };
}

/**
 * Genera recomendaciones personalizadas basadas en condiciones climáticas
 * @param {object} crop - Datos del cultivo
 * @param {object} weather - Datos climáticos actuales
 * @returns {string[]} Array de recomendaciones
 */
function buildRecommendations(crop, weather) {
  const recommendations = [];
  const { temperature, humidity, rainProbability } = weather.current;
  const optimal = crop.optimalConditions;

  if (temperature > 30) {
    recommendations.push("Regar temprano entre 6am y 8am para reducir evaporacion.");
  }

  if (rainProbability > 60) {
    recommendations.push("Evitar riego programado: hay alta probabilidad de lluvia.");
  }

  if (humidity < optimal.humidityMin || humidity < 40) {
    recommendations.push("Aumentar la frecuencia de riego y revisar humedad del suelo.");
  }

  if (temperature < optimal.temperatureMin) {
    recommendations.push(`Proteger el cultivo de bajas temperaturas; ${crop.name} prefiere al menos ${optimal.temperatureMin} C.`);
  }

  if (temperature > optimal.temperatureMax) {
    recommendations.push(`Usar cobertura o sombra parcial cuando sea posible; ${crop.name} rinde mejor bajo ${optimal.temperatureMax} C.`);
  }

  if (!recommendations.length) {
    recommendations.push("Mantener monitoreo diario: las condiciones actuales son manejables para el cultivo.");
  }

  recommendations.push(`Necesidad de agua del cultivo: ${crop.waterRequirement}.`);

  return recommendations;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

/**
 * Genera un plan agrícola con fechas de riego, fertilización y cuidados
 * @param {object} crop - Datos del cultivo
 * @param {object} weather - Datos climáticos actuales
 * @returns {object} Plan agrícola con detalles de manejo
 */
function buildAgriculturalPlan(crop, weather) {
  const today = new Date();
  const shouldAvoidIrrigation = weather.current.rainProbability > 60;
  const irrigationFrequency = weather.current.humidity < crop.optimalConditions.humidityMin ? "cada 2 dias" : "cada 3 dias";

  return {
    irrigation: shouldAvoidIrrigation
      ? "Pausar riego hoy y revaluar manana segun lluvia."
      : `Regar ${irrigationFrequency}, preferentemente 6am-8am.`,
    fertilizationDates: [
      {
        date: addDays(today, 7),
        task: "Fertilizacion inicial y revision de establecimiento."
      },
      {
        date: addDays(today, Math.max(21, Math.round(crop.growthTimeDays * 0.35))),
        task: "Fertilizacion de desarrollo."
      },
      {
        date: addDays(today, Math.max(45, Math.round(crop.growthTimeDays * 0.65))),
        task: "Refuerzo nutricional antes de etapa productiva."
      }
    ],
    care: crop.care
  };
}

function estimateProduction(landSizeHa, crop, climateCoefficient, soilCoefficient) {
  const landSize = Number(landSizeHa);

  if (!Number.isFinite(landSize) || landSize <= 0) {
    throw new Error("El tamano del terreno debe ser mayor a 0 hectareas.");
  }

  if (!Number.isFinite(crop.theoreticalYieldTonHa) || crop.theoreticalYieldTonHa <= 0) {
    throw new Error("Rendimiento teorico invalido del cultivo.");
  }

  if (!Number.isFinite(climateCoefficient) || climateCoefficient <= 0 || climateCoefficient > 1) {
    throw new Error("Coeficiente de clima invalido.");
  }

  if (!Number.isFinite(soilCoefficient) || soilCoefficient <= 0 || soilCoefficient > 1) {
    throw new Error("Coeficiente de suelo invalido.");
  }

  const total = landSize * (crop.theoreticalYieldTonHa * climateCoefficient * soilCoefficient);

  return {
    landSizeHa: landSize,
    theoreticalYieldTonHa: crop.theoreticalYieldTonHa,
    climateCoefficient,
    soilCoefficient,
    totalTon: Number(total.toFixed(2))
  };
}

/**
 * Genera una recomendación agrícola completa basada en todos los parámetros
 * @param {object} params - Parámetros de entrada
 * @param {array} params.crops - Lista de cultivos disponibles
 * @param {object} params.weather - Datos climáticos actuales
 * @param {string} params.soilType - Tipo de suelo
 * @param {string} params.fertilityLevel - Nivel de fertilidad
 * @param {number} params.landSizeHa - Tamaño del terreno en hectáreas
 * @returns {object} Recomendación completa con cultivo, plan y producción estimada
 * @throws {Error} Si los parámetros no son válidos
 */
function generateRecommendation({ crops, weather, soilType, fertilityLevel, landSizeHa }) {
  const soil = getSoilCoefficient(soilType, fertilityLevel);

  if (!soil) {
    throw new Error("Tipo o fertilidad de suelo no validos.");
  }

  const rankedCrops = crops
    .map((crop) => ({
      ...crop,
      score: scoreCrop(crop, weather, soilType)
    }))
    .sort((a, b) => b.score - a.score);

  const selectedCrop = rankedCrops[0];
  const climate = classifyClimate(selectedCrop, weather);
  const production = estimateProduction(landSizeHa, selectedCrop, climate.coefficient, soil.coefficient);

  return {
    crop: selectedCrop,
    alternatives: rankedCrops.slice(1, 4).map((crop) => ({
      id: crop.id,
      name: crop.name,
      score: crop.score,
      theoreticalYieldTonHa: crop.theoreticalYieldTonHa
    })),
    climate,
    soil,
    recommendations: buildRecommendations(selectedCrop, weather),
    plan: buildAgriculturalPlan(selectedCrop, weather),
    production
  };
}

/**
 * Analiza un cultivo específico en condiciones locales
 * @param {object} params - Parámetros de entrada
 * @param {object} params.crop - Cultivo a analizar
 * @param {object} params.weather - Datos climáticos
 * @param {string} params.soilType - Tipo de suelo
 * @param {string} params.fertilityLevel - Nivel de fertilidad
 * @returns {object} Análisis detallado del cultivo con clima y cuidados
 */
function analyzeCropConditions({ crop, weather, soilType, fertilityLevel }) {
  const soil = getSoilCoefficient(soilType, fertilityLevel);
  
  if (!soil) {
    throw new Error("Tipo o fertilidad de suelo no validos.");
  }

  const climate = classifyClimate(crop, weather);
  const score = scoreCrop(crop, weather, soilType);
  const recommendations = buildRecommendations(crop, weather);
  const plan = buildAgriculturalPlan(crop, weather);

  return {
    crop,
    climate,
    soil,
    score,
    recommendations,
    plan,
    analysis: {
      temperatureStatus: classifyTemperature(crop, weather),
      humidityStatus: classifyHumidity(crop, weather),
      rainStatus: classifyRain(weather)
    }
  };
}

function classifyTemperature(crop, weather) {
  const temp = weather.current.temperature;
  const { temperatureMin, temperatureMax } = crop.optimalConditions;
  
  if (temp >= temperatureMin && temp <= temperatureMax) {
    return { status: "ideal", message: `Temperatura ideal: ${temp}°C está en rango ${temperatureMin}-${temperatureMax}°C` };
  } else if (temp < temperatureMin) {
    return { status: "baja", message: `Temperatura muy baja: ${temp}°C (mínimo recomendado: ${temperatureMin}°C)` };
  } else {
    return { status: "alta", message: `Temperatura muy alta: ${temp}°C (máximo recomendado: ${temperatureMax}°C)` };
  }
}

function classifyHumidity(crop, weather) {
  const humidity = weather.current.humidity;
  const { humidityMin, humidityMax } = crop.optimalConditions;
  
  if (humidity >= humidityMin && humidity <= humidityMax) {
    return { status: "ideal", message: `Humedad ideal: ${humidity}% está en rango ${humidityMin}-${humidityMax}%` };
  } else if (humidity < humidityMin) {
    return { status: "baja", message: `Humedad baja: ${humidity}% (mínimo recomendado: ${humidityMin}%)` };
  } else {
    return { status: "alta", message: `Humedad alta: ${humidity}% (máximo recomendado: ${humidityMax}%)` };
  }
}

function classifyRain(weather) {
  const rainProb = weather.current.rainProbability;
  
  if (rainProb <= 30) {
    return { status: "bajo", message: `Probabilidad de lluvia baja: ${rainProb}%` };
  } else if (rainProb <= 70) {
    return { status: "medio", message: `Probabilidad de lluvia moderada: ${rainProb}%` };
  } else {
    return { status: "alto", message: `Probabilidad de lluvia alta: ${rainProb}%` };
  }
}

module.exports = {
  generateRecommendation,
  analyzeCropConditions
};
