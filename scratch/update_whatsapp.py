import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
settings_path = os.path.join(base_dir, 'settings.html')

with io.open(settings_path, 'r', encoding='utf-8') as f:
    html = f.read()

# I will add a new panel in settings.html for WhatsApp Integration
new_panel = """
        <div class="panel" style="border-color: var(--leaf); grid-column: 1 / -1;">
            <div class="panel-head">
                <strong style="color: var(--leaf-dark);">Integración WhatsApp API</strong>
                <span class="badge badge-safe">Conectado</span>
            </div>
            <p style="color:var(--muted); margin-bottom: 25px;">Tus alertas están configuradas para ser enviadas al número registrado. Puedes enviar un mensaje de prueba para verificar la conectividad con el API (CallMeBot / Meta).</p>
            
            <button class="btn btn-green" style="padding:15px; font-size:1.1rem; width:auto;" onclick="testWhatsApp()">📱 Enviar Mensaje de Prueba a WhatsApp</button>
        </div>
"""

# Insert before <div class="panel" style="border-color: var(--danger);">
insert_point = html.find('<div class="panel" style="border-color: var(--danger);">')
if insert_point != -1:
    html = html[:insert_point] + new_panel + "\n" + html[insert_point:]

js_addition = """
    async function testWhatsApp() {
        try {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Enviando...';
            btn.disabled = true;
            
            await fetch('/api/demo/whatsapp', { method: 'POST' });
            
            setTimeout(() => {
                alert("Mensaje enviado. Revisa la consola del servidor backend para ver el envío simulado.");
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 500);
            
        } catch(e) {}
    }
"""

# Insert JS before </script>
end_script = html.find('</script>')
if end_script != -1:
    html = html[:end_script] + js_addition + html[end_script:]

with io.open(settings_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("WhatsApp integration added to Settings.")
