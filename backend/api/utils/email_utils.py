from flask_mail import Message # type: ignore
from extensions import mail

def send_email(to, subject, body):
    msg = Message(subject, recipients=[to])
    msg.body = body
    try:
        mail.send(msg)
    except Exception as e:
        print(f"Error enviando email: {e}")
