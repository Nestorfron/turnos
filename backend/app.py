from flask import Flask # type: ignore
from flask_cors import CORS # type: ignore
from flask_jwt_extended import JWTManager # type: ignore
from flask_admin import Admin # type: ignore
from flask_admin.contrib.sqla import ModelView # type: ignore
from flask_migrate import Migrate # type: ignore
from extensions import mail # type: ignore

from config import Config
from api.models import db, Jefatura, Zona, Dependencia, Usuario, RolOperativo, UsuarioRolOperativo, Turno, TurnoAsignado, SolicitudCambio, Guardia, Licencia, LicenciaMedica, LicenciaSolicitada, ExtraordinariaGuardia, Notificacion

# Importa tus Blueprints
from api.routes import api

# Crear la app
app = Flask(__name__)
app.config.from_object(Config)
mail.init_app(app)

# Extensiones
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

db.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Flask-Admin
admin = Admin(app, name='Panel Admin', template_mode='bootstrap3')
admin.add_view(ModelView(Jefatura, db.session))
admin.add_view(ModelView(Zona, db.session))
admin.add_view(ModelView(Dependencia, db.session))
admin.add_view(ModelView(Usuario, db.session))
admin.add_view(ModelView(RolOperativo, db.session))
admin.add_view(ModelView(UsuarioRolOperativo, db.session))
admin.add_view(ModelView(Turno, db.session))
admin.add_view(ModelView(TurnoAsignado, db.session))
admin.add_view(ModelView(SolicitudCambio, db.session))
admin.add_view(ModelView(Guardia, db.session))
admin.add_view(ModelView(Licencia, db.session))
admin.add_view(ModelView(LicenciaMedica, db.session))
admin.add_view(ModelView(LicenciaSolicitada, db.session))
admin.add_view(ModelView(ExtraordinariaGuardia, db.session))
admin.add_view(ModelView(Notificacion, db.session))


app.register_blueprint(api, url_prefix='/api')


# Rutas básicas para test
@app.route('/ping')
def ping():
    return {'status': 'ok'}, 200

# Crear tablas si no existen (desarrollo)
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
