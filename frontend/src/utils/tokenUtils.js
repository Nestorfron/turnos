export const estaTokenExpirado = (token) => {
  if (!token) {
    alert("Su sesión caducó, por favor vuelve a iniciar sesión.");
    return true;
  }

  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      alert("Su sesión caducó, por favor vuelve a iniciar sesión.");
      return true;
    }

    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    const ahora = Math.floor(Date.now() / 1000);
    if (payload.exp < ahora) {
      alert("Su sesión caducó, por favor vuelve a iniciar sesión.");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error);
    alert("Su sesión caducó, por favor vuelve a iniciar sesión.");
    return true;
  }
};
