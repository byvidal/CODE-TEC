# Guion de Demostración

1. Ejecuta `npm run db:seed` y `npm start`.
2. Abre `http://localhost:3000` en tu navegador para ver el Dashboard.
3. En otra terminal, ejecuta `npm run simulator`.
4. Observa cómo llegan los datos al Dashboard (se actualiza automáticamente cada 2 segundos).
5. En el simulador, la humedad de sustrato descenderá paulatinamente. 
6. Al cruzar el umbral bajo (35%), se generará una **alerta crítica** visible en la interfaz, y la bomba de riego cambiará a estado **ON**.
7. Puedes probar apagar la bomba **manualmente** haciendo clic en los controles del dashboard.
