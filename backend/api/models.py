from flask_sqlalchemy import SQLAlchemy  # type: ignore
from config import Config
from datetime import datetime

db = SQLAlchemy(engine_options=Config.SQLALCHEMY_ENGINE_OPTIONS)


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
            'zonas': [z.serialize() for z in self.zonas]
        }

    def __repr__(self):
        return f'<Jefatura {self.nombre}>'


class Zona(db.Model):
    __tablename__ = 'zonas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    jefatura_id = db.Column(db.Integer, db.ForeignKey('jefaturas.id'), nullable=False)

    dependencia_id = db.Column(
        db.Integer,
        db.ForeignKey('dependencias.id', use_alter=True, name='fk_zona_dependencia'),
        nullable=True
    )

    dependencias = db.relationship(
        'Dependencia',
        backref='zona',
        lazy=True,
        foreign_keys='Dependencia.zona_id'
    )

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'jefatura_id': self.jefatura_id,
            'dependencia_propia': self.dependencia_propia.serialize() if self.dependencia_propia else None,
            'dependencias': [d.serialize() for d in self.dependencias]
        }

    def __repr__(self):
        return f'<Zona {self.nombre}>'


class Dependencia(db.Model):
    __tablename__ = 'dependencias'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=True)

    usuarios = db.relationship('Usuario', backref='dependencia', lazy=True)
    turnos = db.relationship('Turno', backref='dependencia', lazy=True)

    zonas_asignadas = db.relationship(
        'Zona',
        backref='dependencia_propia',
        lazy=True,
        foreign_keys='Zona.dependencia_id'
    )

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'zona_id': self.zona_id,
            'usuarios': [u.serialize() for u in self.usuarios],
            'turnos': [t.serialize() for t in self.turnos]
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
    fecha_ingreso = db.Column(db.DateTime, nullable=True)


    dependencia_id = db.Column(db.Integer, db.ForeignKey('dependencias.id'), nullable=True)
    zona_id = db.Column(db.Integer, db.ForeignKey('zonas.id'), nullable=True)

    turno_id = db.Column(db.Integer, db.ForeignKey('turnos.id'), nullable=True)
    turno = db.relationship('Turno', backref='usuarios_asignados_directamente', foreign_keys=[turno_id])

    estado = db.Column(db.String(50), nullable=True)

    roles_operativos = db.relationship('UsuarioRolOperativo', backref='usuario', lazy=True)
    turnos_asignados = db.relationship('TurnoAsignado', backref='usuario', lazy=True)
    
    zona = db.relationship('Zona', backref='usuarios', foreign_keys=[zona_id])

    guardias = db.relationship('Guardia', backref='usuario', lazy=True)
    extraordinaria_guardias = db.relationship('ExtraordinariaGuardia', backref='usuario', lazy=True)
    licencias = db.relationship('Licencia', backref='usuario', lazy=True)
    licencias_solicitadas = db.relationship('LicenciaSolicitada', backref='usuario', lazy=True)
    licencias_medicas = db.relationship('LicenciaMedica', backref='usuario', lazy=True)

    solicitudes_cambio = db.relationship(
        'SolicitudCambio',
        foreign_keys='SolicitudCambio.usuario_solicitante_id',
        backref='solicitante',
        lazy=True
    )
    aprobaciones = db.relationship(
        'SolicitudCambio',
        foreign_keys='SolicitudCambio.aprobado_por_id',
        backref='aprobador',
        lazy=True
    )

    def serialize(self):
        return {
            'id': self.id,
            'grado': self.grado,
            'nombre': self.nombre,
            'correo': self.correo,
            'rol_jerarquico': self.rol_jerarquico,
            'fecha_ingreso': self.fecha_ingreso,
            'dependencia_id': self.dependencia_id,
            'dependencia_nombre': self.dependencia.nombre if self.dependencia_id and self.dependencia else None,
            'zona_id': self.zona_id,
            'zona_nombre': self.zona.nombre if self.zona_id and self.zona else None,
            'turno_id': self.turno_id,
            'turno_nombre': self.turno.nombre if self.turno_id and self.turno else None,
            'estado': self.estado
        }


    def __repr__(self):
        return f'<Usuario {self.nombre}>'
    

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    expiration = db.Column(db.DateTime, nullable=False)
    usado = db.Column(db.Boolean, default=False)

    usuario = db.relationship('Usuario', backref='reset_tokens')

    def __repr__(self):
        return f'<PasswordResetToken {self.token} for usuario_id {self.usuario_id}>'




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
        return f'<Turno {self.nombre}>'


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
        return f'<TurnoAsignado {self.id}>'


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
        return f'<SolicitudCambio {self.id}>'


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
        return f'<Guardia {self.id}>'
    

class ExtraordinariaGuardia(db.Model):
    __tablename__ = 'extraordinaria_guardias'
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
        return f'<ExtraordinariaGuardia {self.id}>'


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
        return f'<Licencia {self.id}>'

class LicenciaSolicitada(db.Model):
    __tablename__ = 'licencias_solicitadas'
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
        return f'<LicenciaSolicitada {self.id}>'

class LicenciaMedica(db.Model):
    __tablename__ = 'licencias_medicas'
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
        return f'<Licencia_medica {self.id}>'
