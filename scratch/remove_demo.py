import os
import glob
import re

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # index.html (Edafonex)
    content = content.replace('Prototipo desarrollado para el Hackatón.', '© 2026 EDAFONEX. Todos los derechos reservados.')
    content = content.replace('Prototipo desarrollado para el Hackatón', '© 2026 EDAFONEX. Todos los derechos reservados')
    content = content.replace('demo@hackaton.com', 'contacto@empresa.com')
    content = content.replace('demo@hackathon.com', 'contacto@empresa.com')
    content = content.replace('Productor Demo', '')
    content = content.replace('value="Productor Demo"', 'placeholder="Nombre de productor"')
    content = content.replace('value="demo@hackaton.com"', 'placeholder="correo@empresa.com"')

    # register.html & setup.html
    content = content.replace('Crear cuenta demo', 'Crear cuenta')
    content = content.replace('invernadero simulado', 'invernadero')
    content = content.replace('Simulación de Telemetría', 'Telemetría')

    # Navbar/Header replacements
    content = re.sub(r'<span[^>]*>PROTOTIPO HACKATÓN</span>', '', content)
    content = re.sub(r'<span[^>]*>MODO DEMO</span>', '', content)
    
    # settings.html
    content = content.replace('Modo Demo / Reset', 'Restablecer Configuración')
    content = content.replace('Resetea la base de datos a los valores iniciales para repetir la presentación.', 'Devuelve los parámetros del sistema a su estado de fábrica.')
    content = content.replace('Plan:</strong> Demo', 'Plan:</strong> Profesional')
    content = content.replace('Hacer Upgrade (Mock)', 'Gestionar Suscripción')
    
    # Generic hackathon/demo replacements
    content = content.replace('para el Hackatón', '')
    content = content.replace('para el Hackaton', '')
    content = content.replace('simulados en Wokwi o Node.js', 'de campo')
    content = content.replace('simulado', 'operativo')
    content = content.replace('simulados', 'operativos')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for html_file in glob.glob(os.path.join(base_dir, '*.html')):
    process_file(html_file)

# Process app.js if needed
app_js_path = os.path.join(base_dir, 'app.js')
if os.path.exists(app_js_path):
    process_file(app_js_path)

print("Demo marks removed.")
