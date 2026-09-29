import sqlite3
import os

db_path = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\data\greenhouse.db"
db = sqlite3.connect(db_path)
cursor = db.cursor()

try:
    cursor.execute("ALTER TABLE telemetry_readings ADD COLUMN co2 REAL DEFAULT 400;")
    print("Added co2 column.")
except Exception as e:
    print(e)

try:
    cursor.execute("ALTER TABLE telemetry_readings ADD COLUMN ph REAL DEFAULT 7.0;")
    print("Added ph column.")
except Exception as e:
    print(e)

db.commit()
db.close()
