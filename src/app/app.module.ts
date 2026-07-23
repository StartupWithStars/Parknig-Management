import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { LayoutComponent } from './components/layout/layout.component'; 
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ParkingComponent } from './components/parking/parking.component';
import { BookingHistoryComponent } from './components/booking-history/booking-history.component';

import { routes } from './app-routing.module';  

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LayoutComponent, 
    DashboardComponent,
    ParkingComponent,
    BookingHistoryComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,  
    FormsModule,      
    RouterModule.forRoot(routes) 
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent]
})
export class AppModule { }