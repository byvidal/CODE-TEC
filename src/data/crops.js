const crops = [
  {
    id: "maiz",
    name: "Maiz",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 30,
      humidityMin: 45,
      humidityMax: 75,
      soilTypes: ["franco", "limoso", "arcilloso"]
    },
    waterRequirement: "500-800 mm por ciclo",
    growthTimeDays: 120,
    theoreticalYieldTonHa: 8.5,
    care: [
      "Controlar malezas durante las primeras 6 semanas.",
      "Mantener humedad constante en floracion.",
      "Monitorear plagas como gusano cogollero."
    ]
  },
  {
    id: "frijol",
    name: "Frijol",
    optimalConditions: {
      temperatureMin: 16,
      temperatureMax: 28,
      humidityMin: 40,
      humidityMax: 70,
      soilTypes: ["franco", "limoso"]
    },
    waterRequirement: "300-500 mm por ciclo",
    growthTimeDays: 90,
    theoreticalYieldTonHa: 2.2,
    care: [
      "Evitar encharcamientos.",
      "Revisar presencia de roya y antracnosis.",
      "Fertilizar de forma moderada al inicio."
    ]
  },
  {
    id: "trigo",
    name: "Trigo",
    optimalConditions: {
      temperatureMin: 12,
      temperatureMax: 24,
      humidityMin: 45,
      humidityMax: 70,
      soilTypes: ["franco", "arcilloso"]
    },
    waterRequirement: "450-650 mm por ciclo",
    growthTimeDays: 140,
    theoreticalYieldTonHa: 5.8,
    care: [
      "Sembrar con buena nivelacion del terreno.",
      "Vigilar enfermedades foliares.",
      "Evitar deficit hidrico en espigamiento."
    ]
  },
  {
    id: "jitomate",
    name: "Jitomate",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 27,
      humidityMin: 55,
      humidityMax: 80,
      soilTypes: ["franco", "limoso", "arenoso"]
    },
    waterRequirement: "600-900 mm por ciclo",
    growthTimeDays: 100,
    theoreticalYieldTonHa: 45,
    care: [
      "Usar tutoreo para mejorar ventilacion.",
      "Aplicar riego frecuente sin saturar el suelo.",
      "Monitorear mosca blanca y tizones."
    ]
  },
  {
    id: "sorgo",
    name: "Sorgo",
    optimalConditions: {
      temperatureMin: 22,
      temperatureMax: 34,
      humidityMin: 30,
      humidityMax: 65,
      soilTypes: ["franco", "arenoso", "arcilloso"]
    },
    waterRequirement: "350-550 mm por ciclo",
    growthTimeDays: 110,
    theoreticalYieldTonHa: 6.2,
    care: [
      "Adecuado para zonas calidas y con menor disponibilidad de agua.",
      "Cuidar la emergencia con humedad suficiente.",
      "Controlar aves durante llenado de grano."
    ]
  }
];

module.exports = crops;
