import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  show(message: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success') {
    Swal.fire({
      title: message,
      icon: icon,
      position: 'center', 
      showConfirmButton: false, 
      timer: 4000, 
      timerProgressBar: true, 
      background: '#1e293b',
      color: '#ffffff',
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
  }
}