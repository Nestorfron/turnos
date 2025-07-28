/**
 * API UTILS 📡
 * Funciones genéricas para trabajar con tu backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * @param {string} endpoint
 * @returns {string}
 */
const buildUrl = (endpoint) => {
  return `${BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
};

/**
 * GET - fetchData
 * @param {string} endpoint - Ej: "dependencias/1"
 * @param {string} [token] - JWT opcional
 * @param {function} [setter] - Opcional: función para setear datos
 * @param {object} [extraHeaders] - Opcional: headers extra
 * @returns {Promise<any|null>}
 */
export const fetchData = async (endpoint, token, setter, extraHeaders = {}) => {
  const url = buildUrl(endpoint);

  const headers = token
    ? { Authorization: `Bearer ${token}`, ...extraHeaders }
    : { ...extraHeaders };

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[fetchData] ❌ GET ${url} → ${res.status} | Respuesta: ${text}`);
      throw new Error(`GET ${url} → ${res.status}`);
    }

    const data = await res.json();
    if (typeof setter === "function") setter(data);
    return data;
  } catch (err) {
    console.error("[fetchData] ⚠️ Error:", err.message);
    console.error(err.stack);
    return null;
  }
};

/**
 * POST - postData
 * @param {string} endpoint
 * @param {object} payload
 * @param {string} token
 * @param {object} [extraHeaders]
 * @returns {Promise<object|null>}
 */
export const postData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[postData] ❌ POST ${url} → ${res.status} | Respuesta: ${text}`);
      throw new Error(`POST ${url} → ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("[postData] ⚠️ Error:", err.message);
    console.error(err.stack);
    return null;
  }
};

/**
 * PUT - putData
 * @param {string} endpoint
 * @param {object} payload
 * @param {string} token
 * @param {object} [extraHeaders]
 * @returns {Promise<object|null>}
 */
export const putData = async (endpoint, payload, token, extraHeaders = {}) => {
  const url = buildUrl(endpoint);
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...extraHeaders,
    };

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[putData] ❌ PUT ${url} → ${res.status} | Respuesta: ${text}`);
      throw new Error(`PUT ${url} → ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("[putData] ⚠️ Error:", err.message);
    console.error(err.stack);
    return null;
  }
};

/**
 * DELETE - deleteData
 * @param {string} endpoint
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const deleteData = async (endpoint, token) => {
  const url = buildUrl(endpoint);

  // ✅ LOGS de verificación
  console.log("[deleteData] 🗑️ URL:", url);
  console.log("[deleteData] 🗑️ Token tipo:", typeof token, "| Valor:", token ? `${token.slice(0, 20)}...` : "undefined");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  console.log("[deleteData] 🗑️ Headers:", JSON.stringify(headers, null, 2));

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers,
    });

    console.log(`[deleteData] 🔄 Status: ${res.status}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`[deleteData] ❌ DELETE ${url} → ${res.status} | Respuesta: ${text}`);
      throw new Error(`DELETE ${url} → ${res.status}`);
    }

    console.log(`[deleteData] ✅ Eliminado correctamente: ${url}`);
    return true;
  } catch (err) {
    console.error("[deleteData] ⚠️ Error:", err.message);
    console.error(err.stack);
    return false;
  }
};
