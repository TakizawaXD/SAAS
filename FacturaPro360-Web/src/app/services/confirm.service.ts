import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  message: string;
  itemNombre?: string;
  confirmText?: string;
  cancelText?: string;
  tipo?: 'danger' | 'warning' | 'info';
  requiereTextoConfirmacion?: boolean; // Requiere escribir "ELIMINAR" para mayor seguridad
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  isOpen = signal<boolean>(false);
  options = signal<ConfirmOptions>({
    title: '¿Estás seguro?',
    message: 'Esta acción no se puede deshacer.',
    confirmText: 'Sí, continuar',
    cancelText: 'Cancelar',
    tipo: 'danger'
  });

  private resolvePromise: ((value: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this.options.set({
      title: options.title || '¿Estás seguro?',
      message: options.message,
      itemNombre: options.itemNombre,
      confirmText: options.confirmText || 'Sí, eliminar',
      cancelText: options.cancelText || 'Cancelar',
      tipo: options.tipo || 'danger',
      requiereTextoConfirmacion: options.requiereTextoConfirmacion || false
    });

    this.isOpen.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  handleConfirm() {
    this.isOpen.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = null;
    }
  }

  handleCancel() {
    this.isOpen.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = null;
    }
  }
}
