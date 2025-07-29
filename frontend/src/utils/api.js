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

    return await res.json();
  } catch (err) {
    console.error("Error en fetchData:", err);
    return null;
  }
};

export const postData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `POST ${url} → ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const putData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `PUT ${url} → ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const deleteData = async (endpoint, token) => {
  const url = buildUrl(endpoint);
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
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
    throw err;
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `POST ${url} → ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const cambiarPassword = async (usuarioId, payload, token) => {
  const url = buildUrl(`/usuarios/${usuarioId}/cambiar-password`);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
      mode: "cors",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `PUT ${url} → ${res.status}`);
    }

    return data;
  } catch (err) {
    throw err;
  }
};
