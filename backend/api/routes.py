from flask import Blueprint, request, jsonify  # type: ignore
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity  # type: ignore
from werkzeug.security import check_password_hash, generate_password_hash  # type: ignore
from api.models import (
    db, Jefatura, Zona, Dependencia, Usuario, RolOperativo, UsuarioRolOperativo,
    Turno, TurnoAsignado, SolicitudCambio, Guardia, Licencia
)

api = Blueprint("api", __name__)

# -------------------------------------------------------------------
# JEFATURA
# -------------------------------------------------------------------

@api.route('/jefaturas', methods=['POST'])
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
def listar_jefaturas():
    data = Jefatura.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/jefaturas/<int:id>/', methods=['DELETE'])
def eliminar_jefatura(id):
    jefatura = Jefatura.query.get(id)
    if not jefatura:
        return jsonify({"error": "Jefatura no encontrada"}), 404
    db.session.delete(jefatura)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

# -------------------------------------------------------------------
# ZONA
# -------------------------------------------------------------------

@api.route('/zonas', methods=['POST'])
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
def listar_zonas():
    data = Zona.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/zonas/jefatura/<int:id>/', methods=['GET'])
def listar_zonas_por_jefatura(id):
    data = Zona.query.filter_by(jefatura_id=id).all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/zonas/<int:id>/', methods=['DELETE'])
def eliminar_zona(id):
    zona = Zona.query.get(id)
    if not zona:
        return jsonify({"error": "Zona no encontrada"}), 404
    db.session.delete(zona)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

# -------------------------------------------------------------------
# NUEVO: Asignar Dependencia Propia a Zona
# -------------------------------------------------------------------

@api.route('/zonas/<int:zona_id>/asignar_dependencia', methods=['POST'])
def asignar_dependencia_propia(zona_id):
    body = request.json
    dependencia_id = body.get("dependencia_id")
    zona = Zona.query.get(zona_id)
    if not zona:
        return jsonify({"error": "Zona no encontrada"}), 404

    dependencia = Dependencia.query.get(dependencia_id)
    if not dependencia:
        return jsonify({"error": "Dependencia no encontrada"}), 404

    zona.dependencia_id = dependencia.id
    db.session.commit()
    return jsonify(zona.serialize()), 200

# -------------------------------------------------------------------
# NUEVO: Obtener Usuarios de Zona (Dependencia propia + hijas)
# -------------------------------------------------------------------

@api.route('/zonas/<int:zona_id>/usuarios', methods=['GET'])
def listar_usuarios_zona(zona_id):
    zona = Zona.query.get(zona_id)
    if not zona:
        return jsonify({"error": "Zona no encontrada"}), 404

    usuarios_propia = []
    if zona.dependencia_propia:
        usuarios_propia = zona.dependencia_propia.usuarios

    usuarios_dependencias = []
    for dep in zona.dependencias:
        usuarios_dependencias.extend(dep.usuarios)

    todos = usuarios_propia + usuarios_dependencias
    return jsonify([u.serialize() for u in todos]), 200

# -------------------------------------------------------------------
# NUEVO: Detalle completo de Zona
# -------------------------------------------------------------------

@api.route('/zonas/<int:zona_id>/detalle', methods=['GET'])
def detalle_zona(zona_id):
    zona = Zona.query.get(zona_id)
    if not zona:
        return jsonify({"error": "Zona no encontrada"}), 404

    data = zona.serialize()
    usuarios_propia = []
    if zona.dependencia_propia:
        usuarios_propia = [u.serialize() for u in zona.dependencia_propia.usuarios]

    usuarios_dependencias = []
    for dep in zona.dependencias:
        usuarios_dependencias.extend([u.serialize() for u in dep.usuarios])

    return jsonify({
        "zona": data,
        "usuarios_dependencia_propia": usuarios_propia,
        "usuarios_dependencias_hijas": usuarios_dependencias
    }), 200

# -------------------------------------------------------------------
# DEPENDENCIA
# -------------------------------------------------------------------

@api.route('/dependencias', methods=['POST'])
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
def listar_dependencias():
    data = Dependencia.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/dependencias/zona/<int:id>/', methods=['GET'])
def listar_dependencias_por_zona(id):
    data = Dependencia.query.filter_by(zona_id=id).all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/dependencias/<int:id>/', methods=['GET'])
def obtener_dependencia(id):
    dependencia = Dependencia.query.get(id)
    if not dependencia:
        return jsonify({"error": "Dependencia no encontrada"}), 404
    return jsonify(dependencia.serialize()), 200

@api.route('/dependencias/<int:id>/', methods=['DELETE'])
def eliminar_dependencia(id):
    dependencia = Dependencia.query.get(id)
    if not dependencia:
        return jsonify({"error": "Dependencia no encontrada"}), 404
    db.session.delete(dependencia)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

# -------------------------------------------------------------------
# ROLES OPERATIVOS
# -------------------------------------------------------------------

@api.route('/roles', methods=['POST'])
def crear_rol():
    body = request.json
    nombre = body.get("nombre")
    nuevo = RolOperativo(nombre=nombre)
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/roles', methods=['GET'])
def listar_roles():
    data = RolOperativo.query.all()
    return jsonify([x.serialize() for x in data]), 200

# -------------------------------------------------------------------
# TURNOS
# -------------------------------------------------------------------

@api.route('/turnos', methods=['POST'])
def crear_turno():
    body = request.json
    nombre = body.get("nombre")
    hora_inicio = body.get("hora_inicio")
    hora_fin = body.get("hora_fin")
    descripcion = body.get("descripcion")
    dependencia_id = body.get("dependencia_id")
    nuevo = Turno(
        nombre=nombre,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        descripcion=descripcion,
        dependencia_id=dependencia_id
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/turnos', methods=['GET'])
def listar_turnos():
    dependencia_id = request.args.get('dependencia_id', type=int)
    if dependencia_id:
        turnos = Turno.query.filter_by(dependencia_id=dependencia_id).all()
    else:
        turnos = Turno.query.all()
    return jsonify([t.serialize() for t in turnos]), 200

# -------------------------------------------------------------------
# GUARDIAS
# -------------------------------------------------------------------

@api.route('/guardias', methods=['POST'])
def crear_guardia():
    body = request.json
    usuario_id = body.get("usuario_id")
    fecha_inicio = body.get("fecha_inicio")
    fecha_fin = body.get("fecha_fin")
    tipo = body.get("tipo")
    comentario = body.get("comentario")
    nueva = Guardia(
        usuario_id=usuario_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        tipo=tipo,
        comentario=comentario
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/guardias', methods=['GET'])
def listar_guardias():
    data = Guardia.query.all()
    return jsonify([x.serialize() for x in data]), 200

# -------------------------------------------------------------------
# LICENCIAS
# -------------------------------------------------------------------

@api.route('/licencias', methods=['POST'])
def crear_licencia():
    body = request.json
    usuario_id = body.get("usuario_id")
    fecha_inicio = body.get("fecha_inicio")
    fecha_fin = body.get("fecha_fin")
    motivo = body.get("motivo")
    estado = body.get("estado")
    nueva = Licencia(
        usuario_id=usuario_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        motivo=motivo,
        estado=estado
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/licencias', methods=['GET'])
def listar_licencias():
    data = Licencia.query.all()
    return jsonify([x.serialize() for x in data]), 200

# -------------------------------------------------------------------
# SOLICITUDES CAMBIO
# -------------------------------------------------------------------

@api.route('/solicitudes-cambio', methods=['POST'])
def crear_solicitud():
    body = request.json
    usuario_id = body.get("usuario_id")
    turno_original_id = body.get("turno_original_id")
    turno_solicitado_id = body.get("turno_solicitado_id")
    estado = body.get("estado")
    nueva = SolicitudCambio(
        usuario_solicitante_id=usuario_id,
        turno_original_id=turno_original_id,
        turno_solicitado_id=turno_solicitado_id,
        estado=estado
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify(nueva.serialize()), 201

@api.route('/solicitudes-cambio', methods=['GET'])
def listar_solicitudes():
    data = SolicitudCambio.query.all()
    return jsonify([x.serialize() for x in data]), 200

# -------------------------------------------------------------------
# TURNO ASIGNADO
# -------------------------------------------------------------------

@api.route('/turnos-asignados', methods=['POST'])
def crear_turno_asignado():
    body = request.json
    usuario_id = body.get("usuario_id")
    turno_id = body.get("turno_id")
    estado = body.get("estado")
    nuevo = TurnoAsignado(
        usuario_id=usuario_id,
        turno_id=turno_id,
        estado=estado
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify(nuevo.serialize()), 201

@api.route('/turnos-asignados', methods=['GET'])
def listar_turnos_asignados():
    data = TurnoAsignado.query.all()
    return jsonify([x.serialize() for x in data]), 200

# -------------------------------------------------------------------
# USUARIOS
# -------------------------------------------------------------------

@api.route('/usuarios', methods=['GET'])
def listar_usuarios():
    data = Usuario.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/usuarios', methods=['POST'])
def crear_usuario():
    body = request.json
    grado = body.get("grado")
    nombre = body.get("nombre")
    correo = body.get("correo")
    password = body.get("password")
    rol_jerarquico = body.get("rol_jerarquico")
    dependencia_id = body.get("dependencia_id")

    if not grado or not nombre or not correo or not password or not rol_jerarquico or not dependencia_id:
        return jsonify({"error": "Todos los campos son requeridos"}), 400

    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "El correo ya está en uso"}), 400

    password_hash = generate_password_hash(password)
    nuevo_usuario = Usuario(
        grado=grado,
        nombre=nombre,
        correo=correo,
        password=password_hash,
        rol_jerarquico=rol_jerarquico,
        dependencia_id=dependencia_id
    )

    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify({"new_user": nuevo_usuario.serialize()}), 201

# -------------------------------------------------------------------
# LOGIN
# -------------------------------------------------------------------

@api.route('/login', methods=['POST'])
def login():
    body = request.json
    correo = body.get("correo")
    password = body.get("password")
    usuario = Usuario.query.filter_by(correo=correo).first()
    if usuario and check_password_hash(usuario.password, password):
        token = create_access_token(identity=usuario.id)
        return jsonify({"token": token}), 200
    return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
