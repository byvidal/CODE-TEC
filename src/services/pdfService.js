const PDFDocument = require("pdfkit");

/**
 * Escribe un par clave-valor en el PDF con estilos
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} label - Etiqueta
 * @param {*} value - Valor a mostrar
 */
function writeKeyValue(doc, label, value) {
  doc
    .font("Helvetica-Bold")
    .text(`${label}: `, { continued: true })
    .font("Helvetica")
    .text(String(value ?? "-"));
}

/**
 * Escribe una lista de items en el PDF
 * @param {PDFDocument} doc - Documento PDF
 * @param {string[]} items - Array de items a mostrar
 */
function writeList(doc, items) {
  items.forEach((item) => {
    doc.text(`- ${item}`, {
      indent: 12
    });
  });
}

/**
 * Escribe un título de sección con estilos
 * @param {PDFDocument} doc - Documento PDF
 * @param {string} title - Título de la sección
 */
function writeSectionTitle(doc, title) {
  doc
    .moveDown(0.9)
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#1f4c2c")
    .text(title)
    .moveDown(0.35)
    .font("Helvetica")
    .fontSize(10.5)
    .fillColor("#1f2a24");
}

function formatForecast(day) {
  return `${day.date}: ${day.temperatureMin ?? "-"}-${day.temperatureMax ?? "-"} C, lluvia ${day.rainProbability ?? "-"}%`;
}

/**
 * Genera un reporte PDF completo con toda la información agrícola
 * @param {object} data - Datos del reporte
 * @param {object} data.weather - Datos climáticos
 * @param {object} data.crop - Cultivo recomendado
 * @param {object} data.climate - Clasificación del clima
 * @param {object} data.soil - Datos del suelo
 * @param {object} data.production - Estimación de producción
 * @param {string[]} data.recommendations - Recomendaciones
 * @param {object} data.plan - Plan agrícola
 * @param {array} data.alternatives - Cultivos alternativos
 * @returns {PDFDocument} Documento PDF generado
 */
function createAgriculturalReportPdf(data) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: "Reporte PDA",
      Author: "PDA Plataforma de Apoyo Agricola"
    }
  });

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#1f4c2c")
    .text("PDA - Reporte agricola")
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#637168")
    .text(`Generado: ${new Date().toLocaleString("es-MX")}`)
    .moveDown(1);

  const cropSectionTitle = data.reportMode === "selected" ? "Cultivo analizado" : "Cultivo recomendado";

  doc
    .fontSize(11)
    .fillColor("#1f2a24")
    .text("Resumen ejecutivo para toma de decisiones en campo.", {
      underline: false
    });

  writeSectionTitle(doc, "Ubicacion y clima");
  writeKeyValue(doc, "Latitud", data.weather.latitude);
  writeKeyValue(doc, "Longitud", data.weather.longitude);
  writeKeyValue(doc, "Fuente de clima", data.weather.source);
  writeKeyValue(doc, "Zona horaria", data.weather.timezone);
  writeKeyValue(doc, "Temperatura actual", `${data.weather.current.temperature ?? "-"} C`);
  writeKeyValue(doc, "Humedad actual", `${data.weather.current.humidity ?? "-"}%`);
  writeKeyValue(doc, "Probabilidad de lluvia", `${data.weather.current.rainProbability ?? "-"}%`);
  writeKeyValue(doc, "Condicion climatica", `${data.climate.label} (Cc ${data.climate.coefficient})`);

  writeSectionTitle(doc, cropSectionTitle);
  writeKeyValue(doc, "Cultivo", data.crop.name);
  if (data.crop.scientificName) {
    writeKeyValue(doc, "Nombre cientifico", data.crop.scientificName);
  }
  writeKeyValue(doc, "Fuente de cultivos", data.cropSource);
  writeKeyValue(doc, "Requerimiento de agua", data.crop.waterRequirement);
  writeKeyValue(doc, "Tiempo de crecimiento", `${data.crop.growthTimeDays} dias`);
  writeKeyValue(doc, "Rendimiento teorico", `${data.crop.theoreticalYieldTonHa} ton/ha`);

  writeSectionTitle(doc, "Suelo y produccion estimada");
  writeKeyValue(doc, "Tipo de suelo", data.soil.soilLabel);
  writeKeyValue(doc, "Nivel de fertilidad", data.soil.fertilityLevel);
  writeKeyValue(doc, "Coeficiente de fertilidad", data.soil.coefficient);
  writeKeyValue(doc, "Tamano del terreno", `${data.production.landSizeHa} ha`);
  writeKeyValue(doc, "Produccion total estimada", `${data.production.totalTon} toneladas`);
  doc
    .moveDown(0.25)
    .font("Helvetica-Oblique")
    .fillColor("#637168")
    .text("Formula: Terreno x (Rendimiento teorico x Cc x Cf)")
    .font("Helvetica")
    .fillColor("#1f2a24");

  writeSectionTitle(doc, "Recomendaciones");
  writeList(doc, data.recommendations);

  writeSectionTitle(doc, "Plan agricola");
  writeKeyValue(doc, "Riego", data.plan.irrigation);
  doc.font("Helvetica-Bold").text("Fechas de fertilizacion:");
  doc.font("Helvetica");
  writeList(doc, data.plan.fertilizationDates.map((item) => `${item.date}: ${item.task}`));

  if (data.plan.care?.length) {
    doc.moveDown(0.35).font("Helvetica-Bold").text("Cuidados basicos:");
    doc.font("Helvetica");
    writeList(doc, data.plan.care);
  }

  writeSectionTitle(doc, "Pronostico basico");
  writeList(doc, data.weather.forecast.map(formatForecast));

  if (data.alternatives?.length) {
    writeSectionTitle(doc, "Cultivos alternativos");
    writeList(
      doc,
      data.alternatives.map(
        (crop) => `${crop.name}: compatibilidad ${crop.score}/100, rendimiento teorico ${crop.theoreticalYieldTonHa} ton/ha`
      )
    );
  }

  if (data.cropWarning) {
    writeSectionTitle(doc, "Aviso de datos");
    doc.text(data.cropWarning);
  }

  if (data.weather.warning) {
    writeSectionTitle(doc, "Aviso de clima");
    doc.text(data.weather.warning);
  }

  // Agregar pie de página con derechos reservados
  doc.moveTo(48, doc.page.height - 48)
    .lineWidth(1)
    .stroke("#c9d4ca")
    .fontSize(9)
    .fillColor("#999999")
    .text("© Todos los derechos reservados CODE-TEC", 48, doc.page.height - 35, {
      align: "center",
      width: doc.page.width - 96
    });

  return doc;
}

module.exports = {
  createAgriculturalReportPdf
};
