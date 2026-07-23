import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  loggedInUserName: string = '';

  constructor(private router: Router) { }

  settingsForm = {
    totalSlots: 0,
    ratePerHour: 0
  };

  showLogoutModal: boolean = false;
  

  ngOnInit() {
    const activeUserStr = localStorage.getItem('active_parking_user');
    if (activeUserStr) {
      const activeUser = JSON.parse(activeUserStr);
      this.loggedInUserName = activeUser.name || activeUser.username || 'Jeeva Revanth';
    }
  }

 
  isSettingsOpen: boolean = false;
  submitted: boolean = false;
  activeUser: any = null;

  openSettingsModal() {
    this.loadUserData(); 
    this.submitted = false;
    this.isSettingsOpen = true;
  }

  loadUserData() {
    const activeUserStr = localStorage.getItem('active_parking_user');
    if (!activeUserStr) return;
    this.activeUser = JSON.parse(activeUserStr);

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const currentUserDb = allUsers.find((u: any) => u.mobile === this.activeUser.mobile);
    if (currentUserDb) {
      this.settingsForm.totalSlots = currentUserDb.totalSlots || 0;
      this.settingsForm.ratePerHour = currentUserDb.ratePerHour || 0;
    }
  }

  closeSettingsModal() {
    this.isSettingsOpen = false;
  }

  slotsToAdd: number = 0;
  ratePerHour: number = 0;

  onSaveSettings() {
    
    this.submitted = true;
    this.ratePerHour = this.settingsForm.ratePerHour

    if (this.slotsToAdd <= 0 || this.ratePerHour <= 0) {
      return;
    }

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const userIndex = allUsers.findIndex((u: any) => u.mobile === this.activeUser.mobile);

    if (userIndex !== -1) {
      const userRecord = allUsers[userIndex];

      const additionalSlotsCount = Number(this.slotsToAdd);

      userRecord.ratePerHour = Number(this.ratePerHour);

      const previousTotal = Number(userRecord.totalSlots) || 0;
      userRecord.totalSlots = previousTotal + additionalSlotsCount;
      userRecord.available = (Number(userRecord.available) || 0) + additionalSlotsCount;

      if (!userRecord.slotsStateArray) {
        userRecord.slotsStateArray = [];
      }

      for (let i = 1; i <= additionalSlotsCount; i++) {
        const nextId = previousTotal + i;
        const slotNumStr = 'P-' + String(nextId).padStart(3, '0');

        userRecord.slotsStateArray.push({
          id: nextId,
          slotNumber: slotNumStr,
          status: 'available'
        });
      }

      localStorage.setItem('parking_users', JSON.stringify(allUsers));

      this.closeSettingsModal();

      window.location.reload();
    }
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    localStorage.removeItem('active_parking_user');
    this.showLogoutModal = false;
    this.router.navigate(['/login']);
  }

}
