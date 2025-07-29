const BASE_URL = import.meta.env.VITE_API_URL;

const buildUrl = (endpoint) => {
  return `${BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
};

export const fetchData = async (endpoint) => {
  const url = buildUrl(endpoint);

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GET ${url} → ${res.status} | Respuesta: ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error en fetchData:", err);
    return null;
  }
};


export const postData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST ${url} → ${res.status} | Respuesta: ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const putData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...extraHeaders,
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PUT ${url} → ${res.status} | Respuesta: ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const deleteData = async (endpoint, token) => {
  const url = buildUrl(endpoint);
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
      mode: "cors",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DELETE ${url} → ${res.status} | Respuesta: ${text}`);
    }

    return true;
  } catch (err) {
    return false;
  }
};

export const loginUser = async (correo, password) => {
  const url = buildUrl("/login");
  const payload = { correo, password };
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`POST ${url} → ${res.status} | Respuesta: ${text}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return null;
  }
};

export const cambiarPassword = async (usuarioId, payload, token) => {
  return await putData(`/usuarios/${usuarioId}/cambiar-password`, payload, token);
};

