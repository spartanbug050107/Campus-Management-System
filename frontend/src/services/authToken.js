const STORAGE_KEY = "campus_auth_token";

export function getToken() {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setToken(token) {
  if (typeof localStorage === "undefined") return;

  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function clearToken() {
  setToken(null);
}