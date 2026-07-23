import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ParkingAuthService } from '../../common/service/parking-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})

export class DashboardComponent implements OnInit {
  currentUser: any = null;
  totalSlotsCount = 0;
  occupiedSlotsCount = 0;
  availableSlotsCount = 0;

  constructor(
    private authService: ParkingAuthService,
    private router: Router
  ) { }


  ngOnInit() {
    const activeUser = this.authService.getCurrentUser();
    if (!activeUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUser = activeUser;

    const allUsers = JSON.parse(localStorage.getItem('parking_users') || '[]');
    const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);

    console.log('mainUserDbRecord',mainUserDbRecord)

    this.totalSlotsCount = mainUserDbRecord ? Number(mainUserDbRecord.totalSlots) : 0;
    this.occupiedSlotsCount = mainUserDbRecord ? mainUserDbRecord.occupied : 0;
    this.availableSlotsCount = mainUserDbRecord ? mainUserDbRecord.available : 0;
  }

  navigateToParking(): void {
    this.router.navigate(['/parking']);
  }
  getOccupiedPercentage(): number {
    return this.totalSlotsCount > 0 ? (this.occupiedSlotsCount / this.totalSlotsCount) * 100 : 0;
  }

  getAvailablePercentage(): number {
    return this.totalSlotsCount > 0 ? (this.availableSlotsCount / this.totalSlotsCount) * 100 : 0;
  }

}
