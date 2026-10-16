import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any = null;

  modalVisible = signal<boolean>(false);
  puedeInstalarNativamente = signal<boolean>(false);
  instalada = signal<boolean>(false);

  // Deteccion de dispositivo
  esMovil = signal<boolean>(false);
  esIos = signal<boolean>(false);
  esAndroid = signal<boolean>(false);
  esDesktop = computed(() => !this.esMovil());

  constructor() {
    this.detectarDispositivo();
    this.comprobarSiYaEstaInstalada();
    this.escucharEventoInstalacion();
    this.iniciarTemporizadorModal();
  }

  private detectarDispositivo() {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';
    const esIosDispositivo = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const esAndroidDispositivo = /Android/i.test(ua);
    const esPantallaPequena = window.innerWidth <= 768;

    this.esIos.set(esIosDispositivo);
    this.esAndroid.set(esAndroidDispositivo);
    this.esMovil.set(esIosDispositivo || esAndroidDispositivo || esPantallaPequena);
  }

  private comprobarSiYaEstaInstalada() {
    if (typeof window === 'undefined') return;

    const enModoStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const enIosStandalone = (navigator as any).standalone === true;

    if (enModoStandalone || enIosStandalone) {
      this.instalada.set(true);
    }
  }

  private escucharEventoInstalacion() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevenir el banner automatico del navegador para mostrar nuestro modal personalizado
      e.preventDefault();
      this.deferredPrompt = e;
      this.puedeInstalarNativamente.set(true);

      // Si no ha sido descartada, abrir modal
      const descartada = sessionStorage.getItem('facturapro_pwa_dismissed');
      if (!descartada && !this.instalada()) {
        setTimeout(() => {
          this.modalVisible.set(true);
        }, 1800);
      }
    });

    window.addEventListener('appinstalled', () => {
      this.instalada.set(true);
      this.modalVisible.set(false);
      this.deferredPrompt = null;
      this.puedeInstalarNativamente.set(false);
    });
  }

  private iniciarTemporizadorModal() {
    if (typeof window === 'undefined') return;

    // Si es iOS o navegador sin beforeinstallprompt y no ha sido descartada
    setTimeout(() => {
      if (this.instalada()) return;
      const descartada = sessionStorage.getItem('facturapro_pwa_dismissed');
      if (!descartada && !this.modalVisible()) {
        this.modalVisible.set(true);
      }
    }, 2500);
  }

  abrirModal() {
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
    sessionStorage.setItem('facturapro_pwa_dismissed', 'true');
  }

  async ejecutarInstalacion(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.instalada.set(true);
        this.cerrarModal();
      }
      this.deferredPrompt = null;
    } else if (this.esIos()) {
      // En iOS se muestra la guia paso a paso en el modal
      // No se cierra automaticamente para que el usuario pueda ver las instrucciones
    } else {
      // En navegadores de escritorio sin deferredPrompt directo (Edge, Chrome en ciertos perfiles)
      // Se muestran las instrucciones para pulsar el boton (+) en la barra de direcciones
    }
  }
}
