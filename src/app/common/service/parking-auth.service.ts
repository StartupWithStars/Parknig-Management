import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ParkingAuthService {
  private storageKey = 'parking_users';
  private activeUserKey = 'active_parking_user';
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getUsers(): any[] {
    if (this.isBrowser) {
      const users = localStorage.getItem(this.storageKey);
      return users ? JSON.parse(users) : [];
    }
    return []; 
  }

  getCurrentUser(): any {
    if (this.isBrowser) {
      const user = localStorage.getItem(this.activeUserKey);
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  registerUser(userData: any): { success: boolean; message: string } {
    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    // Check if user already exists
    const userExists = allUsers.some((u: any) => u.mobile === userData.mobile);
    if (userExists) {
      return { success: false, message: 'User already exists with this mobile number!' };
    }

    const totalSlotsCount = userData.totalSlots || 0;

    const initialSlotsState = [];
    for (let i = 1; i <= totalSlotsCount; i++) {
      initialSlotsState.push({
        id: i,
        slotNumber: `P-${String(i).padStart(3, '0')}`,
        status: 'available' 
      });
    }

    const newUserRecord = {
      ...userData,
      slotsStateArray: initialSlotsState, 
      bookingHistory: [] 
    };

    allUsers.push(newUserRecord);
    localStorage.setItem('parking_users', JSON.stringify(allUsers));

    return { success: true, message: 'Registration Successful!' };
  }

  loginUser(credentials: any): { success: boolean; message: string; user?: any } {
    if (!this.isBrowser) return { success: false, message: 'Server action restricted' };

    const users = this.getUsers();
    const foundUser = users.find(u => u.mobile === credentials.mobile);

    if (!foundUser) {
      return { success: false, message: 'Mobile number not found. Please Sign Up!' };
    }
    if (foundUser.password !== credentials.password) {
      return { success: false, message: 'Incorrect Password!' };
    }

    const sessionUser = {
      name: foundUser.name,
      mobile: foundUser.mobile,
      password: foundUser.password
    };

    localStorage.setItem(this.activeUserKey, JSON.stringify(sessionUser));
    return { success: true, message: 'Sign in successfully!', user: sessionUser };
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem(this.activeUserKey);
    }
  }
}