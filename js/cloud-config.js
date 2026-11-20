// ===================================================================
// CONFIGURACIÓN CENTRALIZADA EN LA NUBE (TELÉFONOS Y LAPTOPS -> ADMIN)
// ===================================================================
// Para que todos los formularios llenados desde cualquier teléfono o laptop
// lleguen automáticamente a tu panel Admin, pega aquí tus credenciales de
// Supabase (recomendado, gratuito) o de Firebase.
//
// OPCIÓN A: SUPABASE (Recomendado - Gratis y sin configuración compleja)
//   1. Entra a https://supabase.com -> New Project
//   2. En SQL Editor ejecuta:
//      create table if not exists reportes_semanales (
//        id text primary key,
//        payload jsonb not null,
//        created_at timestamptz default now()
//      );
//      alter table reportes_semanales enable row level security;
//      create policy "insert_public" on reportes_semanales for insert with check (true);
//      create policy "select_public" on reportes_semanales for select using (true);
//      create policy "delete_public" on reportes_semanales for delete using (true);
//   3. En Project Settings -> API copia "Project URL" y "anon public key" abajo:

window.EPC_CLOUD_CONFIG = {
  // Pega aquí tu URL y Anon Key de Supabase (o déjalos vacíos si usarás Firebase):
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseTable: "reportes_semanales",

  // OPCIÓN B: FIREBASE (Si prefieres usar Firebase Firestore, pega aquí tu firebaseConfig):
  firebaseConfig: null
  /* Ejemplo Firebase:
  firebaseConfig: {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:xxxxxxxxxxxx"
  }
  */
};

if (window.EPC_CLOUD_CONFIG && window.EPC_CLOUD_CONFIG.firebaseConfig) {
  window.__firebase_config = JSON.stringify(window.EPC_CLOUD_CONFIG.firebaseConfig);
}
