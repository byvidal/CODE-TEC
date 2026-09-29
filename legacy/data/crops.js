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
  },
  {
    id: "cana_azucar",
    name: "Cana de azucar",
    optimalConditions: {
      temperatureMin: 20,
      temperatureMax: 30,
      humidityMin: 60,
      humidityMax: 80,
      soilTypes: ["franco", "limoso", "arcilloso"]
    },
    waterRequirement: "1800-2200 mm por ciclo",
    growthTimeDays: 240,
    theoreticalYieldTonHa: 70,
    care: [
      "Requiere riego regular especialmente en floracion.",
      "Fertilizar con altas dosis de nitrogeno.",
      "Realizar desmenuzamiento para mejor germinacion.",
      "Cosecha entre noviembre y julio para mejor rendimiento."
    ]
  },
  {
    id: "arroz",
    name: "Arroz",
    optimalConditions: {
      temperatureMin: 20,
      temperatureMax: 30,
      humidityMin: 70,
      humidityMax: 90,
      soilTypes: ["limoso", "arcilloso"]
    },
    waterRequirement: "1000-1500 mm por ciclo",
    growthTimeDays: 120,
    theoreticalYieldTonHa: 5.5,
    care: [
      "Mantener lamina de agua constante de 5-10 cm.",
      "Evitar periodos de sequia durante germinacion.",
      "Controlar malezas acuaticas.",
      "Reconocido por alta calidad y denominacion de origen."
    ]
  },
  {
    id: "nopal",
    name: "Nopal",
    optimalConditions: {
      temperatureMin: 15,
      temperatureMax: 35,
      humidityMin: 20,
      humidityMax: 60,
      soilTypes: ["arenoso", "franco", "arcilloso"]
    },
    waterRequirement: "250-400 mm por ciclo",
    growthTimeDays: 240,
    theoreticalYieldTonHa: 25,
    care: [
      "Resistente a sequias y temperaturas extremas.",
      "Requiere buen drenaje del suelo.",
      "Controlar plagas como cochinilla del nopal.",
      "Morelos es uno de los mayores productores nacionales."
    ]
  },
  {
    id: "tomate_verde",
    name: "Tomate verde",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 27,
      humidityMin: 55,
      humidityMax: 80,
      soilTypes: ["franco", "limoso", "arenoso"]
    },
    waterRequirement: "600-900 mm por ciclo",
    growthTimeDays: 95,
    theoreticalYieldTonHa: 35,
    care: [
      "Similar al jitomate rojo pero con ciclo mas corto.",
      "Usar tutoreo para mejor ventilacion.",
      "Aplicar riego frecuente en etapa de fruto.",
      "Monitorear plagas y enfermedades foliares."
    ]
  },
  {
    id: "aguacate",
    name: "Aguacate",
    optimalConditions: {
      temperatureMin: 15,
      temperatureMax: 28,
      humidityMin: 60,
      humidityMax: 80,
      soilTypes: ["franco", "arenoso"]
    },
    waterRequirement: "800-1200 mm por ciclo",
    growthTimeDays: 240,
    theoreticalYieldTonHa: 10,
    care: [
      "Requiere suelos bien drenados.",
      "Sensible al encharcamiento.",
      "Usar cortina rompevientos en zonas ventosas.",
      "Importante hortaliza y fruta de alto valor comercial."
    ]
  },
  {
    id: "pepino",
    name: "Pepino",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 28,
      humidityMin: 60,
      humidityMax: 75,
      soilTypes: ["franco", "limoso", "arenoso"]
    },
    waterRequirement: "400-600 mm por ciclo",
    growthTimeDays: 60,
    theoreticalYieldTonHa: 35,
    care: [
      "Ciclo corto, ideal para cultivos sucesivos.",
      "Proporcionar tutoreo o espaldera.",
      "Riego frecuente sin saturar el suelo.",
      "Cosechar regularmente para estimular produccion."
    ]
  },
  {
    id: "durazno",
    name: "Durazno",
    optimalConditions: {
      temperatureMin: 12,
      temperatureMax: 24,
      humidityMin: 50,
      humidityMax: 70,
      soilTypes: ["franco", "limoso"]
    },
    waterRequirement: "600-800 mm por ciclo",
    growthTimeDays: 180,
    theoreticalYieldTonHa: 18,
    care: [
      "Requiere horas frio para floracion adecuada.",
      "Podar para mantener forma y ventilacion.",
      "Riego moderado, evitar encharcamiento.",
      "Fruta delicada que requiere manejo cuidadoso."
    ]
  },
  {
    id: "calabaza",
    name: "Calabaza",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 28,
      humidityMin: 60,
      humidityMax: 75,
      soilTypes: ["franco", "arenoso"]
    },
    waterRequirement: "500-700 mm por ciclo",
    growthTimeDays: 90,
    theoreticalYieldTonHa: 18,
    care: [
      "Usar tutorea o mulch para proteger frutos.",
      "Riego abundante en etapa de crecimiento.",
      "Fertilizar al inicio de floracion.",
      "Cosechar cuando la cascara este completamente endurecida."
    ]
  },
  {
    id: "amaranto",
    name: "Amaranto",
    optimalConditions: {
      temperatureMin: 18,
      temperatureMax: 28,
      humidityMin: 50,
      humidityMax: 70,
      soilTypes: ["franco", "limoso"]
    },
    waterRequirement: "400-500 mm por ciclo",
    growthTimeDays: 80,
    theoreticalYieldTonHa: 2.5,
    care: [
      "Grano pseudo-cereal nutritivo.",
      "Resistente a condiciones adversas.",
      "Requiere suelo bien preparado.",
      "Ciclo corto similar al maiz pero mas rustico."
    ]
  },
  {
    id: "nochebuena",
    name: "Nochebuena",
    optimalConditions: {
      temperatureMin: 15,
      temperatureMax: 25,
      humidityMin: 60,
      humidityMax: 70,
      soilTypes: ["franco", "limoso"]
    },
    waterRequirement: "300-400 mm por ciclo",
    growthTimeDays: 120,
    theoreticalYieldTonHa: 0.05,
    care: [
      "Cultivo ornamental importante durante fiestas.",
      "Requiere fotoperiodo adecuado para coloreacion.",
      "Mantener humedad relativa moderada.",
      "Morelos es uno de los principales productores de plantas ornamentales."
    ]
  },
  {
    id: "rosa",
    name: "Rosa",
    optimalConditions: {
      temperatureMin: 15,
      temperatureMax: 25,
      humidityMin: 65,
      humidityMax: 80,
      soilTypes: ["franco"]
    },
    waterRequirement: "500-600 mm por ciclo",
    growthTimeDays: 90,
    theoreticalYieldTonHa: 0.1,
    care: [
      "Cultivo ornamental de flores de alto valor.",
      "Podas regulares para estimular floracion.",
      "Excelente ventilacion para evitar enfermedades.",
      "Importante en la produccion de plantas de vivero."
    ]
  }
];

module.exports = crops;
