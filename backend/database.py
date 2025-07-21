import psycopg2 # type: ignore
from psycopg2.extras import RealDictCursor # type: ignore
from config import Config

def get_connection():
    conn = psycopg2.connect(Config.DATABASE_URL, sslmode='require')
    return conn

def fetch_all_turnos():
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM turnos")
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results
