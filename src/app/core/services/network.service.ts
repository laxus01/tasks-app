import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(true);
  public online$: Observable<boolean> = this.onlineSubject.asObservable();

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Inicializa el listener de cambios de red
   */
  private async initializeNetworkListener(): Promise<void> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      // Para web, usar eventos del navegador
      this.initWebNetworkListener();
    } else {
      // Para móvil, usar Capacitor Network plugin
      this.initMobileNetworkListener();
    }

    // Verificar estado inicial
    const status = await this.checkNetworkStatus();
    this.onlineSubject.next(status);
  }

  /**
   * Listener de red para plataforma web
   */
  private initWebNetworkListener(): void {
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.onlineSubject.next(isOnline);
      console.log('Estado de red (Web):', isOnline ? 'Online' : 'Offline');
    });
  }

  /**
   * Listener de red para plataformas móviles
   */
  private async initMobileNetworkListener(): Promise<void> {
    Network.addListener('networkStatusChange', status => {
      const isOnline = status.connected;
      this.onlineSubject.next(isOnline);
      console.log('Estado de red (Mobile):', isOnline ? 'Online' : 'Offline');
    });
  }

  /**
   * Verifica el estado actual de la red
   */
  async checkNetworkStatus(): Promise<boolean> {
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      return navigator.onLine;
    } else {
      const status = await Network.getStatus();
      return status.connected;
    }
  }

  /**
   * Obtiene el estado actual de conexión (síncrono)
   */
  isOnline(): boolean {
    return this.onlineSubject.value;
  }

  /**
   * Espera a que haya conexión a internet
   */
  waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve();
      } else {
        const subscription = this.online$.subscribe(isOnline => {
          if (isOnline) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
  }
}
