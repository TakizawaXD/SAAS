import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();
  if (!currentUser) {
    return router.parseUrl('/login');
  }

  // Roles autorizados para áreas de administración y auditoría
  const rol = (currentUser.rol || '').toLowerCase();
  const esAdmin = rol.includes('administrador') || rol.includes('admin') || rol.includes('gerente') || rol.includes('super');

  if (esAdmin) {
    return true;
  }

  // Si un cliente o usuario no autorizado intenta ingresar, redirigir a 403
  return router.parseUrl('/403');
};
