export function authHeaders() {
  const token = localStorage.getItem("placement_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
