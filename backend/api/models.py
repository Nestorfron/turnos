from flask_sqlalchemy import SQLAlchemy # type: ignore

db = SQLAlchemy()

# -------------------------
# ENTIDADES PRINCIPALES
# -------------------------

class Jefatura(db.Model):
    __tablename__ = 'jefaturas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)

    zonas = db.relationship('Zona', backref='jefatura', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'zonas': [x.serialize() for x in self.zonas]
        }

    def __repr__(self):
        return f'<Jefatura {self.nombre}>'
    
    


class Zona(db.Model):
    __tablename__ = 'zonas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)

    jefatura_id = db.Column(db.Integer, db.ForeignKey('jefaturas.id'), nullable=False)
    dependencias = db.relationship('Dependencia', backref='zona', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'jefatura_id': self.jefatura_id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'dependencias': [x.serialize() for x in self.dependencias]
        }
    
    def __repr__(self):
        return f'<Zona {self.nombre}>'


class Dependencia(db.Model):
    __tablename__ = 'dependencias'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)

    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=False)
    usuarios = db.relationship('Usuario', backref='dependencia', lazy=True)
    turnos = db.relationship('Turno', backref='dependencia', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'zona_id': self.zona_id,
            'nombre': self.nombre,
            'descripcion': self.descripcion
        }
    
    def __repr__(self):
        return f'<Dependencia {self.nombre}>'

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    grado = db.Column(db.String(50), nullable=False)
    nombre = db.Column(db.String(150), nullable=False)
    correo = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol_jerarquico = db.Column(db.String(50), nullable=False)

    dependencia_id = db.Column(db.Integer, db.ForeignKey('dependencias.id'), nullable=False)

    roles_operativos = db.relationship('UsuarioRolOperativo', backref='usuario', lazy=True)
    turnos_asignados = db.relationship('TurnoAsignado', backref='usuario', lazy=True)
    guardias = db.relationship('Guardia', backref='usuario', lazy=True)
    licencias = db.relationship('Licencia', backref='usuario', lazy=True)

    solicitudes_cambio = db.relationship('SolicitudCambio', foreign_keys='SolicitudCambio.usuario_solicitante_id', backref='solicitante', lazy=True)
    aprobaciones = db.relationship('SolicitudCambio', foreign_keys='SolicitudCambio.aprobado_por_id', backref='aprobador', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'dependencia_id': self.dependencia_id,
            'grado': self.grado,
            'nombre': self.nombre,
            'correo': self.correo,
            'password': self.password,
            'rol_jerarquico': self.rol_jerarquico
        }
    
    def __repr__(self):
        return f'<Usuario {self.nombre}>'

class RolOperativo(db.Model):
    __tablename__ = 'roles_operativos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)

    usuarios_roles = db.relationship('UsuarioRolOperativo', backref='rol_operativo', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }
    
    def __repr__(self):
        return f'<RolOperativo {self.nombre}>'

class UsuarioRolOperativo(db.Model):
    __tablename__ = 'usuarios_roles_operativos'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    rol_operativo_id = db.Column(db.Integer, db.ForeignKey('roles_operativos.id'), nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'rol_operativo_id': self.rol_operativo_id
        }
    
    def __repr__(self):
        return f'<UsuarioRolOperativo {self.usuario_id}>'
    
# -------------------------
# TURNOS Y RELACIONADOS
# -------------------------

class Turno(db.Model):
    __tablename__ = 'turnos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)
    descripcion = db.Column(db.Text)

    dependencia_id = db.Column(db.Integer, db.ForeignKey('dependencias.id'), nullable=False)

    turnos_asignados = db.relationship('TurnoAsignado', backref='turno', lazy=True)

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'hora_inicio': str(self.hora_inicio),
            'hora_fin': str(self.hora_fin),
            'descripcion': self.descripcion,
            'dependencia_id': self.dependencia_id
        }

    
    def __repr__(self):
        return f'<Turno {self.descripcion}>'

class TurnoAsignado(db.Model):
    __tablename__ = 'turnos_asignados'
    id = db.Column(db.Integer, primary_key=True)
    turno_id = db.Column(db.Integer, db.ForeignKey('turnos.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    estado = db.Column(db.String(50), nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'turno_id': self.turno_id,
            'usuario_id': self.usuario_id,
            'estado': self.estado
        }
    
    def __repr__(self):
        return f'<TurnoAsignado {self.turno_id}>'

class SolicitudCambio(db.Model):
    __tablename__ = 'solicitudes_cambio'
    id = db.Column(db.Integer, primary_key=True)
    turno_original_id = db.Column(db.Integer, db.ForeignKey('turnos.id'))
    turno_solicitado_id = db.Column(db.Integer, db.ForeignKey('turnos.id'))
    usuario_solicitante_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    aprobado_por_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))

    estado = db.Column(db.String(50), nullable=False)
    fecha_aprobacion = db.Column(db.DateTime)
    comentarios = db.Column(db.Text)

    def serialize(self):
        return {
            'id': self.id,
            'turno_original_id': self.turno_original_id,
            'turno_solicitado_id': self.turno_solicitado_id,
            'usuario_solicitante_id': self.usuario_solicitante_id,
            'aprobado_por_id': self.aprobado_por_id,
            'estado': self.estado,
            'fecha_aprobacion': self.fecha_aprobacion,
            'comentarios': self.comentarios
        }
    
    def __repr__(self):
        return f'<SolicitudCambio {self.turno_original_id}>'


# -------------------------
# GUARDIAS Y LICENCIAS
# -------------------------

class Guardia(db.Model):
    __tablename__ = 'guardias'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha_inicio = db.Column(db.DateTime, nullable=False)
    fecha_fin = db.Column(db.DateTime, nullable=False)
    tipo = db.Column(db.String(50), nullable=False)
    comentario = db.Column(db.Text)

    def serialize(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'fecha_inicio': self.fecha_inicio,
            'fecha_fin': self.fecha_fin,
            'tipo': self.tipo,
            'comentario': self.comentario
        }
    
    def __repr__(self):
        return f'<Guardia {self.usuario_id}>'

class Licencia(db.Model):
    __tablename__ = 'licencias'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date, nullable=False)
    motivo = db.Column(db.String(50), nullable=False)
    estado = db.Column(db.String(50), nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'fecha_inicio': self.fecha_inicio,
            'fecha_fin': self.fecha_fin,
            'motivo': self.motivo,
            'estado': self.estado
        }
    
    def __repr__(self):
        return f'<Licencia {self.usuario_id}>'
