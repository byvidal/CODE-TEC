import sqlite3
import os

db_path = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\data\greenhouse.db"
db = sqlite3.connect(db_path)
cursor = db.cursor()
cursor.execute("INSERT OR IGNORE INTO actuators (id, greenhouseId, zoneId, type, name, state, mode, createdAt) VALUES ('window_01', 'greenhouse_01', 'zone_a', 'window', 'Ventilador Cenital (Ventana)', 'off', 'automatic', '2026-09-29T00:00:00.000Z')")
db.commit()
db.close()
print("Added window actuator.")
