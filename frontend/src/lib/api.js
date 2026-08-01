const TOKEN_KEY = 'erp.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Erreur HTTP enrichie du corps renvoyé par l'API. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  /** Erreurs de validation indexées par nom de champ, pour les formulaires. */
  get parErreur() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.champ, d.message]));
  }
}

// Prévient l'application quand le jeton n'est plus accepté (expiration).
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(method, path, body, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !options.skipAuthRedirect) {
    tokenStore.clear();
    onUnauthorized();
  }

  if (options.raw) {
    if (!response.ok) throw new ApiError(response.status, await messageDErreur(response));
    return response;
  }

  if (response.status === 204) return null;

  const contenu = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      contenu?.error ?? `Erreur ${response.status}`,
      contenu?.details
    );
  }

  return contenu;
}

async function messageDErreur(response) {
  const contenu = await response.json().catch(() => null);
  return contenu?.error ?? `Erreur ${response.status}`;
}

/** Ajoute les paramètres non vides à une query string. */
function query(params = {}) {
  const search = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur !== undefined && valeur !== null && valeur !== '') search.set(cle, valeur);
  }
  const chaine = search.toString();
  return chaine ? `?${chaine}` : '';
}

export const api = {
  get: (path, params) => request('GET', `${path}${query(params)}`),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path, params) => request('DELETE', `${path}${query(params)}`),

  /**
   * Télécharge un PDF. Le jeton voyageant dans un en-tête, on ne peut pas
   * ouvrir l'URL directement : on récupère le blob puis on déclenche le
   * téléchargement côté navigateur.
   */
  async telechargerPdf(path, nomFichier) {
    const response = await request('GET', path, undefined, { raw: true });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    lien.remove();

    // Laisse au navigateur le temps de démarrer le téléchargement.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export default api;
