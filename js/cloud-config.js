// ===================================================================
// CONFIGURACIÓN CENTRALIZADA EN LA NUBE (TELÉFONOS Y LAPTOPS -> ADMIN)
// ===================================================================
window.EPC_CLOUD_CONFIG = {
  supabaseUrl: "https://neocddqqvpvnyrhuaraf.supabase.co",
  // Pega aquí tu Publishable key completa (la que empieza por sb_publishable_...) o tu anon key JWT:
  supabaseAnonKey: "sb_publishable_hMBTu7arfURtgo6Q4q_h8g_6y19VIY4",
  supabaseTable: "reportes_semanales",

  firebaseConfig: null
};

if (window.EPC_CLOUD_CONFIG && window.EPC_CLOUD_CONFIG.firebaseConfig) {
  window.__firebase_config = JSON.stringify(window.EPC_CLOUD_CONFIG.firebaseConfig);
}
