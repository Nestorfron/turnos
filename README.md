# Gestión de Turnos - Backend Flask + React (Frontend con Vite)

## Descripción

Aplicación para gestión de turnos de trabajo con roles (jefe, encargado, funcionario), turnos, guardias, licencias, etc.

Backend en Flask con SQLAlchemy, JWT, Flask-Admin y migraciones con Flask-Migrate.  
Frontend con React (Vite).

La base de datos PostgreSQL está alojada en Supabase.

---

## Estructura del Proyecto

mi-proyecto/
├── frontend/ # Frontend React + Vite
├── backend/ # Backend Flask
│ ├── app.py # Aplicación Flask principal
│ ├── config.py # Configuraciones con variables de entorno
│ ├── models.py # Modelos SQLAlchemy
│ ├── routes/ # Blueprints de rutas
│ ├── requirements.txt
│ ├── Procfile # Para despliegue en Render
│ └── migrations/ # Migraciones Flask-Migrate
├── .gitignore
└── README.md


---

## Requisitos

- Python 3.8+  
- Node.js (para frontend)  
- PostgreSQL en Supabase (base de datos en línea)  

---

## Configuración local Backend

1. Crear y activar entorno virtual:

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
