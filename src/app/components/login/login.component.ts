import { Component, OnInit, Output } from '@angular/core';
import { ParkingAuthService } from '../../common/service/parking-auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../common/service/toast.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isSignUpMode = false;
  signUpData = { name: '', mobile: '', password: '', totalSlots: 0, ratePerHour: '', occupied: 0, available: 0, bookingHistory: [] };
  signInData = { mobile: '', password: '' };

  constructor(
    private authService: ParkingAuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  isPasswordVisible: boolean = false;

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  validateMobileInput(event: any) {
    const pattern = /[0-9]/;
    if (!pattern.test(String.fromCharCode(event.charCode))) event.preventDefault();
  }

  isSignUpValid(): boolean {
    const d = this.signUpData;

    if (!d || !d.name || !d.mobile || !d.password || d.totalSlots === undefined || d.totalSlots === null || !d.ratePerHour) {
      return false;
    }

    const isPasswordValid =
      d.password.length >= 8 &&
      /[A-Z]/.test(d.password) &&
      /[0-9]/.test(d.password) &&
      /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?]/.test(d.password);

    const totalSlotsNum = Number(d.totalSlots);
    const ratePerHourNum = Number(d.ratePerHour);

    return (
      d.name.trim().length > 0 &&
      d.mobile.toString().trim().length === 10 &&
      isPasswordValid &&
      !isNaN(totalSlotsNum) && totalSlotsNum > 0 &&
      !isNaN(ratePerHourNum) && ratePerHourNum > 0
    );
  }

  isSignInValid(): boolean {
    return this.signInData.mobile.length === 10 && this.signInData.password.trim() !== '';
  }

  registerError: boolean = false;

  onSignUp() {
    this.registerError = false;
    if (this.isSignUpValid()) {
      const payload = {
        ...this.signUpData,
        totalSlots: Number(this.signUpData.totalSlots),
        ratePerHour: Number(this.signUpData.ratePerHour),
        available: Number(this.signUpData.totalSlots)
      };

      const result = this.authService.registerUser(payload);
      this.toastService.show(result.message, 'success');

      if (result.message == 'User already exists with this mobile number!') {
        this.registerError = true;
      }

      if (result.success) {
        this.signUpData = {
          name: '',
          mobile: '',
          password: '',
          totalSlots: 0,
          ratePerHour: '0',
          occupied: 0,
          available: 0,
          bookingHistory: []
        };

        this.isSignUpMode = false;
      }
    }
  }

  onSignIn() {
    const result = this.authService.loginUser(this.signInData);
    this.toastService.show(result.message, 'success');

    if (result.success) {
      this.router.navigate(['/dashboard']);
    }
  }
}
