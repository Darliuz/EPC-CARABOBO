// ===================================================================
// CONFIGURACIÓN CENTRALIZADA EN LA NUBE (TELÉFONOS Y LAPTOPS -> ADMIN)
// ===================================================================
window.EPC_CLOUD_CONFIG = {
  supabaseUrl: "https://neocddqqvpvnyrhuaraf.supabase.co",
  // Pega aquí tu Publishable key completa (la que empieza por sb_publishable_...) o tu anon key JWT:
  supabaseAnonKey: "PEGA_AQUI_TU_PUBLISHABLE_KEY_COMPLETA",
  supabaseTable: "reportes_semanales",

  firebaseConfig: null
};

if (window.EPC_CLOUD_CONFIG && window.EPC_CLOUD_CONFIG.firebaseConfig) {
  window.__firebase_config = JSON.stringify(window.EPC_CLOUD_CONFIG.firebaseConfig);
}
