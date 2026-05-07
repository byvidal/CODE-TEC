const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "businessState.json");

const NOTIFICATION_TYPES = [
  {
    id: "lluvia",
    label: "Lluvia intensa",
    description: "Riesgo de lluvia que puede pausar riego o fertilizacion."
  },
  {
    id: "calor",
    label: "Calor extremo",
    description: "Temperaturas altas y riesgo de estres hidrico."
  },
  {
    id: "humedad",
    label: "Humedad baja",
    description: "Baja humedad ambiental o necesidad de revisar suelo."
  },
  {
    id: "riego",
    label: "Riego recomendado",
    description: "Ventanas sugeridas de riego y litros estimados."
  },
  {
    id: "fertilizacion",
    label: "Fertilizacion",
    description: "Recordatorios de tareas del calendario agricola."
  },
  {
    id: "sanidad",
    label: "Plagas y hongos",
    description: "Alertas preventivas por humedad, lluvia o calor."
  },
  {
    id: "resumen",
    label: "Resumen diario",
    description: "Corte diario con clima, tareas y riesgos principales."
  }
];

const BUSINESS_PLANS = {
  free: {
    id: "free",
    name: "Consulta gratis",
    priceMXN: 0,
    currency: "MXN",
    billingLabel: "$0 MXN",
    queryLimit: 1,
    queryLimitLabel: "1 consulta gratis",
    period: "vida",
    whatsappNotifications: false,
    canChooseNotifications: false,
    defaultNotificationTypes: [],
    benefits: [
      "Una consulta agricola completa",
      "Diagnostico de clima, suelo y cultivo",
      "Reporte PDF despues del analisis"
    ]
  },
  plus: {
    id: "plus",
    name: "PDA Plus",
    priceMXN: 129,
    currency: "MXN",
    billingLabel: "$129 MXN/mes",
    queryLimit: 30,
    queryLimitLabel: "30 consultas al mes",
    period: "mensual",
    whatsappNotifications: true,
    canChooseNotifications: false,
    defaultNotificationTypes: ["lluvia", "calor", "humedad", "riego", "fertilizacion"],
    benefits: [
      "30 consultas agricolas al mes",
      "Alertas de lluvia, calor, humedad, riego y fertilizacion",
      "Notificaciones en tiempo real por WhatsApp",
      "Pago mensual con tarjeta"
    ]
  },
  pro: {
    id: "pro",
    name: "PDA Pro",
    priceMXN: 249,
    currency: "MXN",
    billingLabel: "$249 MXN/mes",
    queryLimit: null,
    queryLimitLabel: "Consultas ilimitadas",
    period: "mensual",
    whatsappNotifications: true,
    canChooseNotifications: true,
    defaultNotificationTypes: NOTIFICATION_TYPES.map((item) => item.id),
    benefits: [
      "Consultas ilimitadas",
      "Seleccion de alertas por WhatsApp",
      "Alertas preventivas de clima, riego, fertilizacion y sanidad",
      "Pago mensual con tarjeta"
    ]
  }
};

function getPublicPlans() {
  return Object.values(BUSINESS_PLANS).map((plan) => ({
    ...plan,
    notificationTypes: plan.canChooseNotifications
      ? NOTIFICATION_TYPES
      : NOTIFICATION_TYPES.filter((item) => plan.defaultNotificationTypes.includes(item.id))
  }));
}

function normalizeClientId(clientId) {
  const normalized = String(clientId || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);

  return normalized || "anonymous";
}

function readState() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return { accounts: {} };
    }

    return {
      accounts: parsed.accounts && typeof parsed.accounts === "object" ? parsed.accounts : {}
    };
  } catch (_error) {
    return { accounts: {} };
  }
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function ensureDataFile() {
  const directory = path.dirname(DATA_FILE);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, `${JSON.stringify({ accounts: {} }, null, 2)}\n`);
  }
}

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function addMonthsIso(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate.toISOString();
}

function ensureAccount(state, clientId) {
  const normalizedClientId = normalizeClientId(clientId);

  if (!state.accounts[normalizedClientId]) {
    state.accounts[normalizedClientId] = {
      clientId: normalizedClientId,
      planId: "free",
      billingStatus: "free",
      freeConsultationsUsed: 0,
      monthlyUsage: {},
      whatsappNumber: "",
      notificationPreferences: [],
      payment: null,
      subscription: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  return state.accounts[normalizedClientId];
}

function getActivePlan(account) {
  return BUSINESS_PLANS[account.planId] || BUSINESS_PLANS.free;
}

function buildUsage(account, plan = getActivePlan(account)) {
  const monthKey = getMonthKey();
  const used = plan.id === "free"
    ? Number(account.freeConsultationsUsed || 0)
    : Number(account.monthlyUsage?.[monthKey] || 0);
  const limit = plan.queryLimit;

  return {
    cycle: plan.id === "free" ? "vida" : monthKey,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0),
    label: limit === null ? `${used} usadas este mes` : `${used}/${limit} consultas`
  };
}

function buildMembershipStatus(account) {
  const plan = getActivePlan(account);

  return {
    clientId: account.clientId,
    activePlan: {
      ...plan,
      notificationTypes: plan.canChooseNotifications
        ? NOTIFICATION_TYPES
        : NOTIFICATION_TYPES.filter((item) => plan.defaultNotificationTypes.includes(item.id))
    },
    billingStatus: account.billingStatus || "free",
    usage: buildUsage(account, plan),
    whatsappNumber: account.whatsappNumber || "",
    notificationPreferences: account.notificationPreferences || [],
    payment: account.payment || null,
    subscription: account.subscription || null
  };
}

function getClientMembership(clientId) {
  const state = readState();
  const account = ensureAccount(state, clientId);
  writeState(state);

  return buildMembershipStatus(account);
}

function createHttpError(statusCode, message, details = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, details);
  return error;
}

function assertCanConsult(clientId) {
  const state = readState();
  const account = ensureAccount(state, clientId);
  const plan = getActivePlan(account);
  const usage = buildUsage(account, plan);

  writeState(state);

  if (plan.id === "free" && usage.used >= plan.queryLimit) {
    throw createHttpError(
      402,
      "Ya usaste tu consulta gratis. Elige Plus o Pro para seguir consultando.",
      {
        code: "SUBSCRIPTION_REQUIRED",
        membership: buildMembershipStatus(account),
        plans: getPublicPlans()
      }
    );
  }

  if (plan.queryLimit !== null && usage.used >= plan.queryLimit) {
    throw createHttpError(
      402,
      `Ya usaste las ${plan.queryLimit} consultas de ${plan.name} este mes. Actualiza a Pro para consultas ilimitadas.`,
      {
        code: "PLUS_LIMIT_REACHED",
        membership: buildMembershipStatus(account),
        plans: getPublicPlans()
      }
    );
  }

  return buildMembershipStatus(account);
}

function recordConsultation(clientId) {
  const state = readState();
  const account = ensureAccount(state, clientId);
  const plan = getActivePlan(account);
  const monthKey = getMonthKey();

  if (plan.id === "free") {
    account.freeConsultationsUsed = Number(account.freeConsultationsUsed || 0) + 1;
  } else {
    account.monthlyUsage = account.monthlyUsage || {};
    account.monthlyUsage[monthKey] = Number(account.monthlyUsage[monthKey] || 0) + 1;
  }

  account.updatedAt = new Date().toISOString();
  writeState(state);

  return buildMembershipStatus(account);
}

function subscribeClient({
  clientId,
  planId,
  cardholderName,
  cardNumber,
  cardExpiry,
  cardCvc,
  whatsappNumber,
  notificationPreferences
}) {
  const plan = BUSINESS_PLANS[planId];

  if (!plan || plan.id === "free") {
    throw createHttpError(400, "Selecciona un plan Plus o Pro valido.");
  }

  const normalizedWhatsapp = normalizeWhatsappNumber(whatsappNumber);
  const card = validateCard({ cardholderName, cardNumber, cardExpiry, cardCvc });
  const preferences = resolveNotificationPreferences(plan, notificationPreferences);
  const state = readState();
  const account = ensureAccount(state, clientId);
  const now = new Date();

  account.planId = plan.id;
  account.billingStatus = "active";
  account.whatsappNumber = normalizedWhatsapp;
  account.notificationPreferences = preferences;
  account.payment = {
    method: "card",
    brand: card.brand,
    last4: card.last4
  };
  account.subscription = {
    id: `sub_${now.getTime().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    status: "active",
    startedAt: now.toISOString(),
    renewsAt: addMonthsIso(now, 1),
    paymentProvider: "simulated-card"
  };
  account.updatedAt = now.toISOString();

  writeState(state);

  return buildMembershipStatus(account);
}

function resolveNotificationPreferences(plan, preferences) {
  if (!plan.whatsappNotifications) {
    return [];
  }

  if (!plan.canChooseNotifications) {
    return [...plan.defaultNotificationTypes];
  }

  const allowed = new Set(NOTIFICATION_TYPES.map((item) => item.id));
  const selected = Array.isArray(preferences)
    ? preferences.filter((item) => allowed.has(item))
    : [];

  return selected.length ? [...new Set(selected)] : [...plan.defaultNotificationTypes];
}

function normalizeWhatsappNumber(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");

  if (!/^\+?\d{10,15}$/.test(normalized)) {
    throw createHttpError(400, "Ingresa un numero de WhatsApp valido con lada.");
  }

  return normalized;
}

function validateCard({ cardholderName, cardNumber, cardExpiry, cardCvc }) {
  if (String(cardholderName || "").trim().length < 3) {
    throw createHttpError(400, "Ingresa el nombre del titular de la tarjeta.");
  }

  const digits = String(cardNumber || "").replace(/\D/g, "");

  if (!/^\d{13,19}$/.test(digits) || !passesLuhn(digits)) {
    throw createHttpError(400, "El numero de tarjeta no es valido.");
  }

  if (!isFutureExpiry(cardExpiry)) {
    throw createHttpError(400, "La fecha de vencimiento no es valida.");
  }

  if (!/^\d{3,4}$/.test(String(cardCvc || "").trim())) {
    throw createHttpError(400, "El CVC debe tener 3 o 4 digitos.");
  }

  return {
    brand: detectCardBrand(digits),
    last4: digits.slice(-4)
  };
}

function passesLuhn(value) {
  let sum = 0;
  let shouldDouble = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    let digit = Number(value[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isFutureExpiry(value) {
  const match = String(value || "").trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = Number(match[2].length === 2 ? `20${match[2]}` : match[2]);

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const expiry = new Date(year, month, 0, 23, 59, 59);

  return expiry >= now;
}

function detectCardBrand(digits) {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  return "Tarjeta";
}

module.exports = {
  assertCanConsult,
  getClientMembership,
  getPublicPlans,
  normalizeClientId,
  recordConsultation,
  subscribeClient
};
