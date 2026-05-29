export const environment = {
  production: false,
  get apiUrl() {
    // Si estamos en desarrollo local, usamos el proxy '/api'
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return '/api';
    }
    // Si estamos en producción, usamos la URL absoluta
    return 'https://intranet.pafar.com.ve/ambiente_prueba_intranet/public/api';
    //return 'https://intranet.pafar.com.ve/public/api';

  }
};
