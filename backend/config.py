import os
from dotenv import load_dotenv  # type: ignore

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key")

    # ✅ Configura el pool para evitar "MaxClients"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 5,          # <= Mantiene hasta 5 conexiones abiertas
        "max_overflow": 0,       # <= No permite conexiones extra fuera del pool
        "pool_recycle": 280,     # <= Recicla conexiones viejas cada 280 seg (~5min)
        "pool_timeout": 30,      # <= Tiempo máximo para esperar una conexión libre
        "pool_pre_ping": True    # <= Verifica que la conexión esté viva
    }
