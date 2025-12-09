// shared helpers (index + others)
(function(){
  // ensure users exist (redundant if auth.js loaded earlier)
  if (!localStorage.getItem('absensi_users_v1')) {
    // auth.js already initialises; if not, fallback minimal
    // Do nothing here.
  }
})();
