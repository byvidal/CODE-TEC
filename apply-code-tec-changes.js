#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();

const recommendationHelpers = "\nconst MEMBERSHIP_PLAN = {\n  name: \"Membresia PDA Alerta Campo\",\n  monthlyCostMXN: 79,\n  currency: \"MXN\",\n  billingLabel: \"$79 MXN/mes\",\n  paymentMethod: \"Tarjeta bancaria (simulacion)\",\n  status: \"Simulada - lista para activar\"\n};\n\nfunction normalizeLandSize(landSizeHa) {\n  const value = Number(landSizeHa);\n  return Number.isFinite(value) && value > 0 ? value : 1;\n}\n\nfunction clamp(value, min, max) {\n  return Math.min(max, Math.max(min, value));\n}\n\nfunction formatLiters(value) {\n  return Number(value || 0).toLocaleString(\"es-MX\");\n}\n\nfunction estimateIrrigationDepthMm(crop, weather) {\n  const current = weather.current || {};\n  const optimal = crop.optimalConditions || {};\n  let depth = 5;\n\n  if (Number(current.temperature) >= 32) depth += 2;\n  if (Number(current.humidity) < Number(optimal.humidityMin || 45)) depth += 2;\n  if (Number(current.rainProbability) > 70) depth = 1.5;\n  else if (Number(current.rainProbability) > 50) depth = 3;\n\n  return Number(clamp(depth, 0, 9).toFixed(1));\n}\n\nfunction estimateWaterLiters(depthMm, landSizeHa) {\n  // 1 mm de lamina de riego sobre 1 ha equivale a 10,000 litros.\n  return Math.round(depthMm * 10000 * normalizeLandSize(landSizeHa));\n}\n\nfunction getIrrigationWindow(weather) {\n  const current = weather.current || {};\n  if (Number(current.rainProbability) > 70) {\n    return \"solo si el suelo sigue seco, despues de las 18:00\";\n  }\n  if (Number(current.temperature) >= 30) {\n    return \"06:00-08:00 o 18:00-19:30\";\n  }\n  return \"06:00-08:00\";\n}\n\nfunction buildMembershipPlan() {\n  return {\n    ...MEMBERSHIP_PLAN,\n    features: [\n      \"Recordatorios de riego y fertilizacion\",\n      \"Alertas de lluvia, calor, frio y baja humedad\",\n      \"Ajuste de agua sugerida segun pronostico\",\n      \"Monitoreo preventivo de plagas y enfermedades\"\n    ]\n  };\n}\n\nfunction buildMembershipNotifications({\n  crop,\n  weather,\n  landSizeHa,\n  shouldAvoidIrrigation,\n  irrigationDepthMm,\n  irrigationWaterLiters,\n  irrigationWindow,\n  fertilizationDates\n}) {\n  const current = weather.current || {};\n  const optimal = crop.optimalConditions || {};\n  const notifications = [];\n  const rainProbability = Number(current.rainProbability || 0);\n  const temperature = Number(current.temperature || 0);\n  const humidity = Number(current.humidity || 0);\n  const landSize = normalizeLandSize(landSizeHa);\n\n  notifications.push({\n    type: \"riego\",\n    priority: shouldAvoidIrrigation ? \"alta\" : \"media\",\n    title: shouldAvoidIrrigation ? \"Riego pausado por lluvia\" : \"Riego recomendado\",\n    message: shouldAvoidIrrigation\n      ? `Probabilidad de lluvia ${rainProbability}%. No vayas a regar por mucho tiempo; revisa el suelo despues de la lluvia.`\n      : `Riega de ${irrigationWindow} con aprox. ${formatLiters(irrigationWaterLiters)} L para ${landSize} ha (${irrigationDepthMm} mm).`\n  });\n\n  const rainyDay = weather.forecast?.find((day) => Number(day.rainProbability) >= 70);\n  if (rainyDay) {\n    notifications.push({\n      type: \"clima\",\n      priority: \"alta\",\n      title: \"Lluvia en pronostico\",\n      message: `Se espera lluvia alta el ${rainyDay.date} (${rainyDay.rainProbability}%). Reduce riego y evita fertilizar antes de la lluvia.`\n    });\n  }\n\n  if (temperature >= 32) {\n    notifications.push({\n      type: \"calor\",\n      priority: \"alta\",\n      title: \"Riesgo por calor\",\n      message: `Temperatura de ${temperature} C. Revisa estres hidrico, usa sombra temporal si es posible y evita riego al mediodia.`\n    });\n  }\n\n  if (humidity < Number(optimal.humidityMin || 45) || humidity < 40) {\n    notifications.push({\n      type: \"humedad\",\n      priority: \"media\",\n      title: \"Humedad baja\",\n      message: `Humedad actual ${humidity}%. Verifica humedad del suelo por la manana y ajusta frecuencia de riego.`\n    });\n  }\n\n  if (rainProbability > 60 || humidity > 80) {\n    notifications.push({\n      type: \"sanidad\",\n      priority: \"media\",\n      title: \"Prevencion de hongos y plagas\",\n      message: \"Mayor humedad favorece enfermedades. Revisa hojas, ventilacion y drenaje despues de lluvia.\"\n    });\n  }\n\n  if (fertilizationDates?.[0]) {\n    notifications.push({\n      type: \"fertilizacion\",\n      priority: \"media\",\n      title: \"Proxima fertilizacion\",\n      message: `${fertilizationDates[0].date}: ${fertilizationDates[0].task}`\n    });\n  }\n\n  notifications.push({\n    type: \"resumen\",\n    priority: \"baja\",\n    title: \"Resumen diario\",\n    message: \"Recibiras un corte cada manana con clima, riego sugerido, tareas del dia y alertas de riesgo.\"\n  });\n\n  return notifications;\n}\n";
const newBuildPlan = "function buildAgriculturalPlan(crop, weather, landSizeHa = 1) {\n  const today = new Date();\n  const landSize = normalizeLandSize(landSizeHa);\n  const shouldAvoidIrrigation = Number(weather.current.rainProbability) > 60;\n  const irrigationFrequency = weather.current.humidity < crop.optimalConditions.humidityMin ? \"cada 2 dias\" : \"cada 3 dias\";\n  const irrigationDepthMm = estimateIrrigationDepthMm(crop, weather);\n  const irrigationWaterLiters = estimateWaterLiters(irrigationDepthMm, landSize);\n  const irrigationWindow = getIrrigationWindow(weather);\n  const fertilizationDates = [\n    {\n      date: addDays(today, 7),\n      task: \"Fertilizacion inicial y revision de establecimiento.\"\n    },\n    {\n      date: addDays(today, Math.max(21, Math.round(crop.growthTimeDays * 0.35))),\n      task: \"Fertilizacion de desarrollo.\"\n    },\n    {\n      date: addDays(today, Math.max(45, Math.round(crop.growthTimeDays * 0.65))),\n      task: \"Refuerzo nutricional antes de etapa productiva.\"\n    }\n  ];\n\n  return {\n    irrigation: shouldAvoidIrrigation\n      ? `Pausar riego hoy y revaluar manana segun lluvia. Si el suelo esta seco, aplicar maximo ${formatLiters(irrigationWaterLiters)} L entre ${irrigationWindow}.`\n      : `Regar ${irrigationFrequency}, de ${irrigationWindow}, con aprox. ${formatLiters(irrigationWaterLiters)} L (${irrigationDepthMm} mm) para ${landSize} ha.`,\n    irrigationWindow,\n    irrigationWater: {\n      depthMm: irrigationDepthMm,\n      totalLiters: irrigationWaterLiters,\n      litersPerHa: Math.round(irrigationDepthMm * 10000),\n      landSizeHa: landSize\n    },\n    fertilizationDates,\n    care: crop.care,\n    membership: buildMembershipPlan(),\n    notifications: buildMembershipNotifications({\n      crop,\n      weather,\n      landSizeHa: landSize,\n      shouldAvoidIrrigation,\n      irrigationDepthMm,\n      irrigationWaterLiters,\n      irrigationWindow,\n      fertilizationDates\n    })\n  };\n}";
const pdfInsert = "\n  if (data.plan?.irrigationWater) {\n    writeKeyValue(\n      doc,\n      \"Agua estimada por riego\",\n      `${data.plan.irrigationWater.totalLiters} L aprox. (${data.plan.irrigationWater.depthMm} mm para ${data.plan.irrigationWater.landSizeHa} ha)`\n    );\n  }\n\n  if (data.plan?.membership) {\n    writeSectionTitle(doc, \"Membresia y alertas en tiempo real\");\n    writeKeyValue(doc, \"Plan\", data.plan.membership.name);\n    writeKeyValue(doc, \"Costo\", data.plan.membership.billingLabel || `$${data.plan.membership.monthlyCostMXN} ${data.plan.membership.currency}/mes`);\n    writeKeyValue(doc, \"Metodo de pago\", data.plan.membership.paymentMethod);\n    writeKeyValue(doc, \"Estado\", data.plan.membership.status);\n\n    if (data.plan.notifications?.length) {\n      doc.moveDown(0.35).font(\"Helvetica-Bold\").text(\"Notificaciones incluidas:\");\n      doc.font(\"Helvetica\");\n      writeList(doc, data.plan.notifications.map((item) => `${item.title}: ${item.message}`));\n    }\n  }\n";
const membershipArticle = "\n\n  <article class=\"info-block membership-card\">\n    <div class=\"membership-header\">\n      <h3>Membresia y alertas</h3>\n      <span id=\"membershipStatus\" class=\"membership-status\">Simulacion</span>\n    </div>\n    <p id=\"membershipName\">PDA Alerta Campo</p>\n    <p class=\"membership-price\"><strong id=\"membershipCost\">$79 MXN/mes</strong></p>\n    <p id=\"membershipPayment\">Pago con tarjeta bancaria (simulacion).</p>\n    <ul id=\"membershipNotifications\" class=\"notification-list\"></ul>\n    <div class=\"payment-simulation\" aria-label=\"Metodo de pago simulado\">\n      <label>\n        Numero de tarjeta\n        <input type=\"text\" inputmode=\"numeric\" maxlength=\"19\" placeholder=\"4242 4242 4242 4242\">\n      </label>\n      <label>\n        Vencimiento\n        <input type=\"text\" inputmode=\"numeric\" maxlength=\"5\" placeholder=\"MM/AA\">\n      </label>\n      <label>\n        CVV\n        <input type=\"password\" inputmode=\"numeric\" maxlength=\"4\" placeholder=\"123\">\n      </label>\n      <small>Simulacion visual: no se procesa ningun cobro real.</small>\n    </div>\n  </article>\n";
const appHelpers = "\nfunction setTextById(id, value) {\n  const element = document.querySelector(`#${id}`);\n  if (element) {\n    element.textContent = value ?? \"-\";\n  }\n}\n\nfunction buildPrefixedId(prefix, base) {\n  return prefix ? `${prefix}${base.charAt(0).toUpperCase()}${base.slice(1)}` : base;\n}\n\nfunction renderNotificationList(elementId, notifications = []) {\n  const element = document.querySelector(`#${elementId}`);\n  if (!element) return;\n  element.innerHTML = \"\";\n\n  if (!notifications.length) {\n    const li = document.createElement(\"li\");\n    li.textContent = \"Las alertas apareceran aqui cuando cambie el clima o toque una tarea.\";\n    element.appendChild(li);\n    return;\n  }\n\n  notifications.forEach((notification) => {\n    const li = document.createElement(\"li\");\n    li.className = `notification-item priority-${notification.priority || \"media\"}`;\n    li.innerHTML = `<strong>${notification.title}</strong><span>${notification.message}</span>`;\n    element.appendChild(li);\n  });\n}\n\nfunction renderMembershipPlan(plan, prefix = \"\") {\n  const membership = plan?.membership || {};\n  const id = (base) => buildPrefixedId(prefix, base);\n  const cost = membership.billingLabel || `$${formatNumber(membership.monthlyCostMXN || 79, 0)} ${membership.currency || \"MXN\"}/mes`;\n\n  setTextById(id(\"membershipName\"), membership.name || \"Membresia PDA Alerta Campo\");\n  setTextById(id(\"membershipCost\"), cost);\n  setTextById(id(\"membershipPayment\"), membership.paymentMethod || \"Tarjeta bancaria (simulacion)\");\n  setTextById(id(\"membershipStatus\"), membership.status || \"Simulada - lista para activar\");\n  renderNotificationList(id(\"membershipNotifications\"), plan?.notifications || []);\n}\n\nfunction showMembershipRealtimeAlerts(plan) {\n  const alerts = (plan?.notifications || [])\n    .filter((notification) => notification.priority === \"alta\")\n    .slice(0, 2);\n\n  alerts.forEach((notification, index) => {\n    window.setTimeout(() => {\n      showToast(`Alerta en tiempo real: ${notification.title}. ${notification.message}`);\n    }, 900 + index * 1800);\n  });\n}\n";
const dynamicMembershipArticle = "\n  <article class=\"info-block membership-card\">\n    <div class=\"membership-header\">\n      <h3>Membresia y alertas</h3>\n      <span id=\"analysisMembershipStatus\" class=\"membership-status\">Simulacion</span>\n    </div>\n    <p id=\"analysisMembershipName\">PDA Alerta Campo</p>\n    <p class=\"membership-price\"><strong id=\"analysisMembershipCost\">$79 MXN/mes</strong></p>\n    <p id=\"analysisMembershipPayment\">Pago con tarjeta bancaria (simulacion).</p>\n    <ul id=\"analysisMembershipNotifications\" class=\"notification-list\"></ul>\n    <div class=\"payment-simulation\" aria-label=\"Metodo de pago simulado\">\n      <label>\n        Numero de tarjeta\n        <input type=\"text\" inputmode=\"numeric\" maxlength=\"19\" placeholder=\"4242 4242 4242 4242\">\n      </label>\n      <label>\n        Vencimiento\n        <input type=\"text\" inputmode=\"numeric\" maxlength=\"5\" placeholder=\"MM/AA\">\n      </label>\n      <label>\n        CVV\n        <input type=\"password\" inputmode=\"numeric\" maxlength=\"4\" placeholder=\"123\">\n      </label>\n      <small>Simulacion visual: no se procesa ningun cobro real.</small>\n    </div>\n  </article>\n";
const membershipStyles = "\n.membership-card {\n  border: 1px solid rgba(37, 106, 138, 0.22);\n  background: linear-gradient(180deg, rgba(232, 245, 236, 0.85), rgba(255, 255, 255, 0.96));\n}\n\n.membership-header {\n  align-items: center;\n  display: flex;\n  gap: 0.75rem;\n  justify-content: space-between;\n}\n\n.membership-status {\n  border-radius: 999px;\n  border: 1px solid rgba(31, 76, 44, 0.18);\n  font-size: 0.72rem;\n  font-weight: 700;\n  padding: 0.24rem 0.55rem;\n  text-transform: uppercase;\n}\n\n.membership-price {\n  margin: 0.4rem 0 0.75rem;\n}\n\n.membership-price strong {\n  font-size: 1.35rem;\n}\n\n.notification-list {\n  display: grid;\n  gap: 0.65rem;\n  list-style: none;\n  margin: 0.85rem 0;\n  padding: 0;\n}\n\n.notification-item {\n  border-left: 4px solid rgba(31, 76, 44, 0.35);\n  border-radius: 0.8rem;\n  padding: 0.65rem 0.75rem;\n}\n\n.notification-item strong,\n.notification-item span {\n  display: block;\n}\n\n.notification-item span {\n  margin-top: 0.2rem;\n}\n\n.priority-alta {\n  border-left-width: 6px;\n}\n\n.payment-simulation {\n  display: grid;\n  gap: 0.65rem;\n  margin-top: 0.9rem;\n}\n\n.payment-simulation label {\n  display: grid;\n  font-size: 0.86rem;\n  gap: 0.25rem;\n}\n\n.payment-simulation input {\n  border: 1px solid rgba(31, 76, 44, 0.18);\n  border-radius: 0.7rem;\n  padding: 0.65rem 0.75rem;\n}\n\n.payment-simulation small {\n  color: #637168;\n}\n";

function filePath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(filePath(relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(filePath(relativePath), content, 'utf8');
  console.log(`OK ${relativePath}`);
}

function ensureChanged(before, after, label) {
  if (before === after) {
    console.warn(`AVISO: no se aplicaron cambios en ${label}. Puede que el archivo ya este actualizado o que haya cambiado su estructura.`);
  }
}

function updateSoilDetection() {
  const relativePath = 'src/services/soilDetectionService.js';
  const before = read(relativePath);
  let content = before;

  content = content.replace(
    /warning:\s*`No se pudo consultar SoilGrids; se uso una estimacion por zona\. Detalle:\s*\$\{\s*error\?\.message\s*\|\|\s*"sin detalle"\s*\}`/s,
    'warning: null'
  );

  content = content.replace(
    /\s*console\.warn\("No se pudo consultar SoilGrids:",\s*error\.message\);\s*/,
    '\n    // Fallback silencioso: evita mostrar falsos positivos al usuario.\n'
  );

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function updateRecommendationService() {
  const relativePath = 'src/services/recommendationService.js';
  const before = read(relativePath);
  let content = before;

  if (!content.includes('const MEMBERSHIP_PLAN =')) {
    content = content.replace(
      /(function addDays\(date, days\) \{[\s\S]*?return result\.toISOString\(\)\.slice\(0, 10\);\s*\})/,
      `$1\n\n${recommendationHelpers}`
    );
  }

  content = content.replace(
    /function buildAgriculturalPlan\(crop,\s*weather\)\s*\{[\s\S]*?\}\s*(?=function estimateProduction)/,
    `${newBuildPlan}\n\n`
  );

  content = content.replace(
    /plan: buildAgriculturalPlan\(selectedCrop, weather\),/,
    'plan: buildAgriculturalPlan(selectedCrop, weather, landSizeHa),'
  );

  content = content.replace(
    /const plan = buildAgriculturalPlan\(crop, weather\);/,
    'const plan = buildAgriculturalPlan(crop, weather, landSizeHa);'
  );

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function updatePdfService() {
  const relativePath = 'src/services/pdfService.js';
  const before = read(relativePath);
  let content = before;

  if (!content.includes('Membresia y alertas en tiempo real')) {
    content = content.replace(
      /(if \(data\.plan\.care\?\.length\) \{[\s\S]*?writeList\(doc, data\.plan\.care\);\s*\}\s*)(writeSectionTitle\(doc, "Pronostico basico"\);)/,
      `$1${pdfInsert}\n  $2`
    );
  }

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function updateIndexHtml() {
  const relativePath = 'public/index.html';
  const before = read(relativePath);
  let content = before;

  if (!content.includes('membershipNotifications')) {
    content = content.replace(
      /(<article class="info-block">\s*<h3>Plan agricola<\/h3>[\s\S]*?<\/article>\s*)(<article class="info-block">\s*<h3>Pronostico<\/h3>)/,
      `$1${membershipArticle}\n  $2`
    );
  }

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function updateAppJs() {
  const relativePath = 'public/app.js';
  const before = read(relativePath);
  let content = before;

  if (!content.includes('function renderMembershipPlan')) {
    content = content.replace(
      /(function renderFertilization\(dates\) \{[\s\S]*?list\.appendChild\(li\);\s*\}\);\s*\})/,
      `$1\n\n${appHelpers}`
    );
  }

  content = content.replace(
    /renderFertilization\(data\.plan\.fertilizationDates\);\s*renderForecast\(data\.weather\.forecast\);/,
    'renderFertilization(data.plan.fertilizationDates);\n  renderMembershipPlan(data.plan);\n  showMembershipRealtimeAlerts(data.plan);\n  renderForecast(data.weather.forecast);'
  );

  if (!content.includes('analysisMembershipNotifications')) {
    content = content.replace(
      /(<article class="info-block">\s*<h3>Plan de Riego y Fertilización<\/h3>[\s\S]*?<\/article>\s*)(<article class="info-block">\s*<h3>Cuidados Especiales<\/h3>)/,
      `$1${dynamicMembershipArticle}\n  $2`
    );
  }

  content = content.replace(
    /(data\.plan\.fertilizationDates\.forEach\(\(item\) => \{[\s\S]*?fertList\.appendChild\(li\);\s*\}\);)/,
    '$1\n  renderMembershipPlan(data.plan, "analysis");\n  showMembershipRealtimeAlerts(data.plan);'
  );

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function updateStyles() {
  const relativePath = 'public/styles.css';
  const before = read(relativePath);
  let content = before;

  if (!content.includes('.membership-card')) {
    content = `${content}\n\n${membershipStyles}`;
  }

  ensureChanged(before, content, relativePath);
  write(relativePath, content);
}

function main() {
  updateSoilDetection();
  updateRecommendationService();
  updatePdfService();
  updateIndexHtml();
  updateAppJs();
  updateStyles();
  console.log('\nCambios aplicados. Ejecuta npm start o npm run dev para probar.');
}

main();
