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


const MEMBERSHIP_PLAN = {
  name: "Membresia PDA Alerta Campo",
  monthlyCostMXN: 79,
  currency: "MXN",
  billingLabel: "$79 MXN/mes",
  paymentMethod: "Tarjeta bancaria (simulacion)",
  status: "Simulada - lista para activar"
};

function normalizeLandSize(landSizeHa) {
  const value = Number(landSizeHa);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatLiters(value) {
  return Number(value || 0).toLocaleString("es-MX");
}

function estimateIrrigationDepthMm(crop, weather) {
  const current = weather.current || {};
  const optimal = crop.optimalConditions || {};
  let depth = 5;

  if (Number(current.temperature) >= 32) depth += 2;
  if (Number(current.humidity) < Number(optimal.humidityMin || 45)) depth += 2;
  if (Number(current.rainProbability) > 70) depth = 1.5;
  else if (Number(current.rainProbability) > 50) depth = 3;

  return Number(clamp(depth, 0, 9).toFixed(1));
}

function estimateWaterLiters(depthMm, landSizeHa) {
  // 1 mm de lamina de riego sobre 1 ha equivale a 10,000 litros.
  return Math.round(depthMm * 10000 * normalizeLandSize(landSizeHa));
}

function getIrrigationWindow(weather) {
  const current = weather.current || {};
  if (Number(current.rainProbability) > 70) {
    return "solo si el suelo sigue seco, despues de las 18:00";
  }
  if (Number(current.temperature) >= 30) {
    return "06:00-08:00 o 18:00-19:30";
  }
  return "06:00-08:00";
}

function buildMembershipPlan() {
  return {
    ...MEMBERSHIP_PLAN,
    features: [
      "Recordatorios de riego y fertilizacion",
      "Alertas de lluvia, calor, frio y baja humedad",
      "Ajuste de agua sugerida segun pronostico",
      "Monitoreo preventivo de plagas y enfermedades"
    ]
  };
}

function buildMembershipNotifications({
  crop,
  weather,
  landSizeHa,
  shouldAvoidIrrigation,
  irrigationDepthMm,
  irrigationWaterLiters,
  irrigationWindow,
  fertilizationDates
}) {
  const current = weather.current || {};
  const optimal = crop.optimalConditions || {};
  const notifications = [];
  const rainProbability = Number(current.rainProbability || 0);
  const temperature = Number(current.temperature || 0);
  const humidity = Number(current.humidity || 0);
  const landSize = normalizeLandSize(landSizeHa);

  notifications.push({
    type: "riego",
    priority: shouldAvoidIrrigation ? "alta" : "media",
    title: shouldAvoidIrrigation ? "Riego pausado por lluvia" : "Riego recomendado",
    message: shouldAvoidIrrigation
      ? `Probabilidad de lluvia ${rainProbability}%. No vayas a regar por mucho tiempo; revisa el suelo despues de la lluvia.`
      : `Riega de ${irrigationWindow} con aprox. ${formatLiters(irrigationWaterLiters)} L para ${landSize} ha (${irrigationDepthMm} mm).`
  });

  const rainyDay = weather.forecast?.find((day) => Number(day.rainProbability) >= 70);
  if (rainyDay) {
    notifications.push({
      type: "clima",
      priority: "alta",
      title: "Lluvia en pronostico",
      message: `Se espera lluvia alta el ${rainyDay.date} (${rainyDay.rainProbability}%). Reduce riego y evita fertilizar antes de la lluvia.`
    });
  }

  if (temperature >= 32) {
    notifications.push({
      type: "calor",
      priority: "alta",
      title: "Riesgo por calor",
      message: `Temperatura de ${temperature} C. Revisa estres hidrico, usa sombra temporal si es posible y evita riego al mediodia.`
    });
  }

  if (humidity < Number(optimal.humidityMin || 45) || humidity < 40) {
    notifications.push({
      type: "humedad",
      priority: "media",
      title: "Humedad baja",
      message: `Humedad actual ${humidity}%. Verifica humedad del suelo por la manana y ajusta frecuencia de riego.`
    });
  }

  if (rainProbability > 60 || humidity > 80) {
    notifications.push({
      type: "sanidad",
      priority: "media",
      title: "Prevencion de hongos y plagas",
      message: "Mayor humedad favorece enfermedades. Revisa hojas, ventilacion y drenaje despues de lluvia."
    });
  }

  if (fertilizationDates?.[0]) {
    notifications.push({
      type: "fertilizacion",
      priority: "media",
      title: "Proxima fertilizacion",
      message: `${fertilizationDates[0].date}: ${fertilizationDates[0].task}`
    });
  }

  notifications.push({
    type: "resumen",
    priority: "baja",
    title: "Resumen diario",
    message: "Recibiras un corte cada manana con clima, riego sugerido, tareas del dia y alertas de riesgo."
  });

  return notifications;
}


/**
 * Genera un plan agrícola con fechas de riego, fertilización y cuidados
 * @param {object} crop - Datos del cultivo
 * @param {object} weather - Datos climáticos actuales
 * @returns {object} Plan agrícola con detalles de manejo
 */
function buildAgriculturalPlan(crop, weather, landSizeHa = 1) {
  const today = new Date();
  const landSize = normalizeLandSize(landSizeHa);
  const shouldAvoidIrrigation = Number(weather.current.rainProbability) > 60;
  const irrigationFrequency = weather.current.humidity < crop.optimalConditions.humidityMin ? "cada 2 dias" : "cada 3 dias";
  const irrigationDepthMm = estimateIrrigationDepthMm(crop, weather);
  const irrigationWaterLiters = estimateWaterLiters(irrigationDepthMm, landSize);
  const irrigationWindow = getIrrigationWindow(weather);
  const fertilizationDates = [
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
  ];

  return {
    irrigation: shouldAvoidIrrigation
      ? `Pausar riego hoy y revaluar manana segun lluvia. Si el suelo esta seco, aplicar maximo ${formatLiters(irrigationWaterLiters)} L entre ${irrigationWindow}.`
      : `Regar ${irrigationFrequency}, de ${irrigationWindow}, con aprox. ${formatLiters(irrigationWaterLiters)} L (${irrigationDepthMm} mm) para ${landSize} ha.`,
    irrigationWindow,
    irrigationWater: {
      depthMm: irrigationDepthMm,
      totalLiters: irrigationWaterLiters,
      litersPerHa: Math.round(irrigationDepthMm * 10000),
      landSizeHa: landSize
    },
    fertilizationDates,
    care: crop.care,
    membership: buildMembershipPlan(),
    notifications: buildMembershipNotifications({
      crop,
      weather,
      landSizeHa: landSize,
      shouldAvoidIrrigation,
      irrigationDepthMm,
      irrigationWaterLiters,
      irrigationWindow,
      fertilizationDates
    })
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
    plan: buildAgriculturalPlan(selectedCrop, weather, landSizeHa),
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
function analyzeCropConditions({ crop, weather, soilType, fertilityLevel, landSizeHa }) {
  const soil = getSoilCoefficient(soilType, fertilityLevel);
  
  if (!soil) {
    throw new Error("Tipo o fertilidad de suelo no validos.");
  }

  const climate = classifyClimate(crop, weather);
  const score = scoreCrop(crop, weather, soilType);
  const recommendations = buildRecommendations(crop, weather);
  const plan = buildAgriculturalPlan(crop, weather, landSizeHa);
  const production = landSizeHa === undefined || landSizeHa === null || landSizeHa === ""
    ? null
    : estimateProduction(landSizeHa, crop, climate.coefficient, soil.coefficient);

  const result = {
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

  if (production) {
    result.production = production;
  }

  return result;
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
