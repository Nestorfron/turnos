export const estaTokenExpirado = (token) => {
    if (!token) return true;
  
    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) return true;
  
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
  
      const ahora = Math.floor(Date.now() / 1000);
      return payload.exp < ahora;
    } catch (error) {
      console.error("Error al verificar expiración del token:", error);
      return true;
    }
  };
  