import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth/authService';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log(`Interceptor HTTP: Procesando petición a ${req.url}`);

  // Endpoints a los que NO queremos inyectar el token (porque no lo necesitan o usarán el refresh_token)
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/token/refresh');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    console.log(`Interceptor HTTP: Añadiendo Token (comienza por: ${token.substring(0, 10)}...)`);
    authReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'token': token,               
        'authorized': token,          
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  } else if (!token && !isAuthEndpoint) {
    console.warn('Interceptor HTTP: No se encontró token en localStorage.');
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`Interceptor HTTP: Error en petición a ${req.url}`, error);
      
      // Si recibimos un 401, intentamos refrescar el token
      if (error.status === 401 && !req.url.includes('/login')) {
        console.log('Interceptor HTTP: Error 401 detectado, intentando refrescar token...');
        return authService.refreshToken().pipe(
          switchMap((res) => {
            console.log('Interceptor HTTP: Token refrescado con éxito, reintentando petición.');
            const newToken = res.token;
            const retryReq = req.clone({
              setHeaders: {
                'Authorization': `Bearer ${newToken}`,
                'token': newToken,
                'authorized': newToken
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.error('Interceptor HTTP: Falló el refresco del token, cerrando sesión.');
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
