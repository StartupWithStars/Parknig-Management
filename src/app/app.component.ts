import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  

  title = 'parking-management-system';
  loggedInUserName: string = '';
  showSidebar: boolean = true; 
  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/login') || event.url === '/') {
        this.showSidebar = false;
      } else {
        this.showSidebar = true;
        this.extractActiveSessionProfile(); 
      }
    });
  }

  ngOnInit() {
    this.extractActiveSessionProfile();
  }

  extractActiveSessionProfile() {
    const activeUserStr = localStorage.getItem('active_parking_user');
    if (activeUserStr) {
      const activeUser = JSON.parse(activeUserStr);
      this.loggedInUserName = activeUser.name || activeUser.username || 'Jeeva Revanth';
    }
  }

  onLogoutActionClick() {
    if (confirm('Are you sure you want to logout from SmartPark, bro?')) {
      localStorage.removeItem('active_parking_user');
      this.loggedInUserName = '';
      this.showSidebar = false;

      this.router.navigate(['/login']);
    }
  }
}