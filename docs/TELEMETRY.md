# Flujo de Telemetría

1. **Dispositivo/Simulador**: Genera lecturas y envía `POST /api/telemetry/readings` con Token.
2. **Adquisición**: Express recibe. Rate limiter protege el endpoint. Middleware autentica.
3. **Validación**: Verifica pertenencia a zona y rangos físicos (ej. temp -20 a 80).
4. **Persistencia**: SQLite.
5. **Reglas**: Motor de reglas analiza lecturas y genera alertas/comandos a actuadores.
