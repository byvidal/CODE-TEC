const { getSoilCoefficient } = require("../utils/soil");

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

  const total = landSize * (crop.theoreticalYieldTonHa * climateCoefficient * soilCoefficient);

  return {
    landSizeHa: landSize,
    theoreticalYieldTonHa: crop.theoreticalYieldTonHa,
    climateCoefficient,
    soilCoefficient,
    totalTon: Number(total.toFixed(2))
  };
}

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

module.exports = {
  generateRecommendation
};
