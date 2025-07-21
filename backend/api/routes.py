from flask import Blueprint, request, jsonify # type: ignore
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity # type: ignore
from werkzeug.security import check_password_hash, generate_password_hash # type: ignore
from api.models import db, Jefatura, Zona, Dependencia, Usuario, RolOperativo, UsuarioRolOperativo, Turno, TurnoAsignado, SolicitudCambio, Guardia, Licencia

api = Blueprint("api", __name__)


######## JEFATURA ########

@api.route('/jefaturas', methods=['POST'])
#@jwt_required()
def crear_jefatura():
    body = request.json
    nombre = body.get("nombre")
    if not nombre:
        return jsonify({"error": "Falta nombre"}), 400

    nueva = Jefatura(nombre=nombre)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/jefaturas', methods=['GET'])
#@jwt_required()
def listar_jefaturas():
    data = Jefatura.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/jefaturas/<int:id>/', methods=['DELETE'])
#@jwt_required()
def eliminar_jefatura(id):
    jefatura = Jefatura.query.get(id)
    db.session.delete(jefatura)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

######## ZONA ########

@api.route('/zonas', methods=['POST'])
#@jwt_required()
def crear_zona():
    body = request.json
    nombre = body.get("nombre")
    jefatura_id = body.get("jefatura_id")
    descripcion = body.get("descripcion")
    nueva = Zona(nombre=nombre, jefatura_id=jefatura_id, descripcion=descripcion)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/zonas', methods=['GET'])
#@jwt_required()
def listar_zonas():
    data = Zona.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/zonas/jefatura/<int:id>/', methods=['GET'])
#@jwt_required()
def listar_zonas_por_jefatura(id):
    data = Zona.query.filter_by(jefatura_id=id).all()
    return jsonify([x.serialize() for x in data]), 200


@api.route('/zonas/<int:id>/', methods=['DELETE'])
#@jwt_required()
def eliminar_zona(id):
    zona = Zona.query.get(id)
    db.session.delete(zona)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

######## DEPENDENCIA ########

@api.route('/dependencias', methods=['POST'])
#@jwt_required()
def crear_dependencia():
    body = request.json
    nombre = body.get("nombre")
    descripcion = body.get("descripcion")
    zona_id = body.get("zona_id")
    nueva = Dependencia(nombre=nombre, descripcion=descripcion, zona_id=zona_id)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/dependencias', methods=['GET'])
#@jwt_required()
def listar_dependencias():
    data = Dependencia.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/dependencias/zona/<int:id>/', methods=['GET'])
#@jwt_required()
def listar_dependencias_por_zona(id):
    data = Dependencia.query.filter_by(zona_id=id).all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/dependencias/<int:id>/', methods=['GET'])
#@jwt_required()
def obtener_dependencia(id):
    dependencia = Dependencia.query.get(id)
    return jsonify(dependencia.serialize()), 200

@api.route('/dependencias/<int:id>/', methods=['DELETE'])
#@jwt_required()
def eliminar_dependencia(id):
    dependencia = Dependencia.query.get(id)
    db.session.delete(dependencia)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

######## ROL OPERATIVO ########

@api.route('/roles', methods=['POST'])
#@jwt_required()
def crear_rol():
    body = request.json
    nombre = body.get("nombre")
    nuevo = RolOperativo(nombre=nombre)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/roles', methods=['GET'])
#@jwt_required()
def listar_roles():
    data = RolOperativo.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## TURNOS ########

@api.route('/turnos', methods=['POST'])
#@jwt_required()
def crear_turno():
    body = request.json
    nombre = body.get("nombre")
    hora_inicio = body.get("hora_inicio")
    hora_fin = body.get("hora_fin")
    descripcion = body.get("descripcion")
    dependencia_id = body.get("dependencia_id")
    nuevo = Turno(nombre=nombre, hora_inicio=hora_inicio, hora_fin=hora_fin, descripcion=descripcion, dependencia_id=dependencia_id)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/turnos', methods=['GET'])
#@jwt_required()
def listar_turnos():
    data = Turno.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## GUARDIAS ########

@api.route('/guardias', methods=['POST'])
#@jwt_required()
def crear_guardia():
    body = request.json
    usuario_id = body.get("usuario_id")
    turno_id = body.get("turno_id")
    fecha_inicio = body.get("fecha_inicio")
    fecha_fin = body.get("fecha_fin")
    nueva = Guardia(usuario_id=usuario_id, turno_id=turno_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/guardias', methods=['GET'])
#@jwt_required()
def listar_guardias():
    data = Guardia.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## LICENCIAS ########

@api.route('/licencias', methods=['POST'])
#@jwt_required()
def crear_licencia():
    body = request.json
    usuario_id = body.get("usuario_id")
    fecha_inicio = body.get("fecha_inicio")
    fecha_fin = body.get("fecha_fin")
    nueva = Licencia(usuario_id=usuario_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/licencias', methods=['GET'])
#@jwt_required()
def listar_licencias():
    data = Licencia.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## SOLICITUDES CAMBIO ########

@api.route('/solicitudes-cambio', methods=['POST'])
#@jwt_required()
def crear_solicitud():
    body = request.json
    usuario_id = body.get("usuario_id")
    turno_id = body.get("turno_id")
    fecha = body.get("fecha")
    nueva = SolicitudCambio(usuario_id=usuario_id, turno_id=turno_id, fecha=fecha)
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/solicitudes-cambio', methods=['GET'])
#@jwt_required()
def listar_solicitudes():
    data = SolicitudCambio.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## TURNO ASIGNADO ########

@api.route('/turnos-asignados', methods=['POST'])
#@jwt_required()
def crear_turno_asignado():
    body = request.json
    usuario_id = body.get("usuario_id")
    turno_id = body.get("turno_id")
    fecha = body.get("fecha")
    nuevo = TurnoAsignado(usuario_id=usuario_id, turno_id=turno_id, fecha=fecha)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/turnos-asignados', methods=['GET'])
#@jwt_required()
def listar_turnos_asignados():
    data = TurnoAsignado.query.all()
    return jsonify([x.serialize() for x in data]), 200

######## USUARIO ########

@api.route('/usuarios', methods=['GET'])
#@jwt_required()
def listar_usuarios():
    data = Usuario.query.all()
    return jsonify([x.serialize() for x in data]), 200

#REGISTRAR USUARIOS

@api.route('/usuarios', methods=['POST'])
#@jwt_required()
def crear_usuario():
    body = request.json

    grado = body.get("grado")
    nombre = body.get("nombre")
    correo = body.get("correo")
    password = body.get("password")
    rol_jerarquico = body.get("rol_jerarquico")
    dependencia_id = body.get("dependencia_id")

    # Validar campos obligatorios
    if not grado or not nombre or not correo or not password or not rol_jerarquico or not dependencia_id:
        return jsonify({"error": "Todos los campos son requeridos: grado, nombre, correo, password, rol_jerarquico, dependencia_id"}), 400

    # Validar unicidad del correo
    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "El correo ya está en uso"}), 400

    # Hashear password
    password_hash = generate_password_hash(password)

    # Crear nuevo usuario
    nuevo_usuario = Usuario(
        grado=grado,
        nombre=nombre,
        correo=correo,
        password=password_hash,
        rol_jerarquico=rol_jerarquico,
        dependencia_id=dependencia_id
    )

    try:
        db.session.add(nuevo_usuario)
        db.session.commit()
        return jsonify({"new_user": nuevo_usuario.serialize()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

#LOGIN
@api.route('/login', methods=['POST'])
def login():
    body = request.json
    correo = body.get("correo")
    password = body.get("password")
    usuario = Usuario.query.filter_by(correo=correo).first()
    if usuario and check_password_hash(usuario.password, password):
        token = create_access_token(identity=usuario.id)
        return jsonify({"token": token}), 200
    else:
        return jsonify({"error": "Usuario o contraseña incorrectos"}), 401 
