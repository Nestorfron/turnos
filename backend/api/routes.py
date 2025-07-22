from flask import Blueprint, request, jsonify # type: ignore
from flask_jwt_extended import create_access_token # type: ignore
from werkzeug.security import generate_password_hash, check_password_hash # type: ignore
from api.models import db, Jefatura, Zona, Dependencia, Usuario, RolOperativo, Turno, TurnoAsignado, Guardia, Licencia, SolicitudCambio

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

@api.route('/jefaturas/<int:id>', methods=['DELETE'])
def eliminar_jefatura(id):
    jefatura = Jefatura.query.get(id)
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

@api.route('/zonas/<int:id>', methods=['DELETE'])
def eliminar_zona(id):
    zona = Zona.query.get(id)
    db.session.delete(zona)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

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

@api.route('/dependencias/<int:id>', methods=['GET'])
def obtener_dependencia(id):
    dependencia = Dependencia.query.get(id)
    return jsonify(dependencia.serialize()), 200

@api.route('/dependencias/<int:id>', methods=['PUT'])
def actualizar_dependencia(id):
    body = request.json
    dependencia = Dependencia.query.get(id)
    if not dependencia:
        return jsonify({"error": "Dependencia no encontrada"}), 404
    dependencia.nombre = body.get("nombre")
    dependencia.descripcion = body.get("descripcion")
    db.session.commit()
    return jsonify(dependencia.serialize()), 200

@api.route('/dependencias/<int:id>', methods=['DELETE'])
def eliminar_dependencia(id):
    dependencia = Dependencia.query.get(id)
    db.session.delete(dependencia)
    db.session.commit()
    return jsonify({'status': 'ok'}), 200

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

@api.route('/turnos/<int:id>', methods=['PUT'])
def actualizar_turno(id):
    body = request.json
    turno = Turno.query.get(id)
    if not turno:
        return jsonify({"error": "Turno no encontrado"}), 404
    turno.nombre = body.get("nombre")
    turno.hora_inicio = body.get("hora_inicio")
    turno.hora_fin = body.get("hora_fin")
    turno.descripcion = body.get("descripcion")
    turno.dependencia_id = body.get("dependencia_id")
    db.session.commit()
    return jsonify(turno.serialize()), 200


@api.route('/turnos', methods=['GET'])
def listar_turnos():
    dependencia_id = request.args.get('dependencia_id', type=int)
    if dependencia_id:
        turnos = Turno.query.filter_by(dependencia_id=dependencia_id).all()
    else:
        turnos = Turno.query.all()
    return jsonify([t.serialize() for t in turnos]), 200

@api.route('/turnos/<int:turno_id>', methods=['DELETE'])
def eliminar_turno(turno_id):
    turno = Turno.query.get(turno_id)
    if not turno:
        return jsonify({"error": "Turno no encontrado"}), 404
    db.session.delete(turno)
    db.session.commit()
    return jsonify({"turno": turno.serialize()}), 200

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

    nueva = Guardia(usuario_id=usuario_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, tipo=tipo, comentario=comentario)
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

    nueva = Licencia(usuario_id=usuario_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin, motivo=motivo, estado=estado)
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

    nueva = SolicitudCambio(usuario_solicitante_id=usuario_id, turno_original_id=turno_original_id, turno_solicitado_id=turno_solicitado_id, estado=estado)
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

    nuevo = TurnoAsignado(usuario_id=usuario_id, turno_id=turno_id, estado=estado)
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
@api.route('/usuarios', methods=['POST'])
def crear_usuario():
    body = request.json
    grado = body.get("grado")
    nombre = body.get("nombre")
    correo = body.get("correo")
    password = body.get("password")
    rol_jerarquico = body.get("rol_jerarquico")
    dependencia_id = body.get("dependencia_id")
    zona_id = body.get("zona_id")
    estado = body.get("estado")

    if not grado or not nombre or not correo or not password or not rol_jerarquico:
        return jsonify({"error": "Faltan campos obligatorios"}), 400

    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "El correo ya está en uso"}), 400

    if rol_jerarquico == 'JEFE_ZONA':
        if not zona_id:
            return jsonify({"error": "Un jefe de zona debe tener zona_id"}), 400
        dependencia_id = None
    else:
        if not dependencia_id:
            return jsonify({"error": "Este usuario debe tener dependencia_id"}), 400
        zona_id = None

    password_hash = generate_password_hash(password)

    nuevo_usuario = Usuario(
        grado=grado,
        nombre=nombre,
        correo=correo,
        password=password_hash,
        rol_jerarquico=rol_jerarquico,
        dependencia_id=dependencia_id,
        zona_id=zona_id,
        estado=estado
    )
    db.session.add(nuevo_usuario)
    db.session.commit()
    return jsonify(nuevo_usuario.serialize()), 201



@api.route('/usuarios', methods=['GET'])
def listar_usuarios():
    data = Usuario.query.all()
    return jsonify([x.serialize() for x in data]), 200

@api.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    body = request.json

    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    grado = body.get("grado", usuario.grado)
    nombre = body.get("nombre", usuario.nombre)
    correo = body.get("correo", usuario.correo)
    password = body.get("password", usuario.password)
    rol_jerarquico = body.get("rol_jerarquico", usuario.rol_jerarquico)
    dependencia_id = body.get("dependencia_id", usuario.dependencia_id)
    zona_id = body.get("zona_id", usuario.zona_id)
    estado = body.get("estado", usuario.estado) 
    if rol_jerarquico == 'JEFE_ZONA':
        if not zona_id:
            return jsonify({"error": "Un jefe de zona debe tener zona_id"}), 400
        dependencia_id = None
    else:
        if not dependencia_id:
            return jsonify({"error": "Este usuario debe tener dependencia_id"}), 400
        zona_id = None

    usuario.grado = grado
    usuario.nombre = nombre
    usuario.correo = correo
    usuario.password = password
    usuario.rol_jerarquico = rol_jerarquico
    usuario.dependencia_id = dependencia_id
    usuario.zona_id = zona_id
    usuario.estado = estado 

    db.session.commit()
    return jsonify(usuario.serialize()), 200



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

        # Devuelve token + info usuario relevante (id, nombre, correo)
        return jsonify({
            "token": token,
            "id": usuario.id,
            "nombre": usuario.nombre,
            "correo": usuario.correo,
            "rol": usuario.rol_jerarquico,
            "zona_id": usuario.zona_id,
            "dependencia_id": usuario.dependencia_id,
        }), 200

    return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
