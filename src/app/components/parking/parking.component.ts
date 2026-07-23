import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../common/service/toast.service';

interface ParkingSlot {
  id: number;
  slotNumber: string;
  status: 'available' | 'occupied' | 'reserved';
}
interface Booking {
  tokenId: string;
  slotId: number;
  slotNumber: string;
  vehicleNo: string;
  ownerName: string;
  bookedAt: string;
  status?: 'closed' | string;
  closedAt?: string;
  durationInHrs?: number;
  ratePerHr?: number;
  totalAmount?: number;
}

@Component({
  selector: 'app-parking',
  templateUrl: './parking.component.html',
  styleUrl: './parking.component.scss'
})
export class ParkingComponent implements OnInit {
  parkingSlots: ParkingSlot[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private toastService: ToastService) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadAndGenerateGrid();
    }
  }

  get laneGroups() {
    const lanes = [];
    const chunkSize = 8; 

    for (let i = 0; i < this.parkingSlots.length; i += chunkSize) {
      lanes.push({
        laneName: `LANE ${Math.floor(i / chunkSize) + 1}`,
        slots: this.parkingSlots.slice(i, i + chunkSize)
      });
    }
    return lanes;
  }

  loadAndGenerateGrid() {
    const activeUserStr = localStorage.getItem('active_parking_user');
    if (!activeUserStr) return;
    const activeUser = JSON.parse(activeUserStr);

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);
    if (!mainUserDbRecord) return;

    const totalCountFromDb = Number(mainUserDbRecord.totalSlots) || 0;

    if (mainUserDbRecord.slotsStateArray && mainUserDbRecord.slotsStateArray.length === totalCountFromDb) {
      this.parkingSlots = mainUserDbRecord.slotsStateArray;
    } else {
      this.parkingSlots = [];
      for (let i = 1; i <= totalCountFromDb; i++) {
        this.parkingSlots.push({
          id: i,
          slotNumber: `P-${String(i).padStart(3, '0')}`,
          status: 'available'
        });
      }

      mainUserDbRecord.slotsStateArray = this.parkingSlots;
      mainUserDbRecord.available = totalCountFromDb;
      mainUserDbRecord.occupied = 0;

      localStorage.setItem('parking_users', JSON.stringify(allUsers));
    }
  }

  bookingPopup: boolean = false;

  selectedSlot: ParkingSlot | null = null;

  bookingData = {
    vehicleNo: '',
    ownerName: '',
  };


  isClearPopupOpen: boolean = false;
  selectedBooking: Booking | null = null;

  clearData = {
    closedAt: '',
    durationHrs: 0,
    ratePerHr: 0,
    totalAmount: 0
  };

  onSlotClick(slot: ParkingSlot) {
    debugger
    if (slot.status === 'available') {
      this.selectedSlot = slot;
      this.bookingPopup = true;
      const now = new Date();
    } else {
      this.isClearPopupOpen = true;

      const activeUserStr = localStorage.getItem('active_parking_user');
      if (!activeUserStr) return;
      const activeUser = JSON.parse(activeUserStr);

      const allUsersStr = localStorage.getItem('parking_users') || '[]';
      const allUsers = JSON.parse(allUsersStr);

      const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);
      this.clearData.ratePerHr = mainUserDbRecord.ratePerHour;

      if (mainUserDbRecord && mainUserDbRecord.bookingHistory) {
        this.selectedBooking = mainUserDbRecord.bookingHistory.find((booking: any) => booking.slotId === slot.id && !booking.status);
        this.isClearPopupOpen = true;

        let time: any = this.selectedBooking?.bookedAt

        const currentNow = new Date();
        this.clearData.closedAt = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

        const bookedTime = new Date(time).getTime();
        const closedTime = currentNow.getTime();
        const diffMs = closedTime - bookedTime;

        const computedHours = Math.ceil(diffMs / (1000 * 60 * 60)) || 1;
        this.clearData.durationHrs = computedHours;

        this.calculateFinalBillAmount();
      }

    }
  }
  calculateFinalBillAmount() {
    const rate = Number(this.clearData.ratePerHr) || 0;
    this.clearData.totalAmount = this.clearData.durationHrs * rate;
  }

  onConfirmClearSlot() {
    if (!this.selectedBooking) return;

    const activeUserStr = localStorage.getItem('active_parking_user');
    if (!activeUserStr) return;
    const activeUser = JSON.parse(activeUserStr);

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);
    if (!mainUserDbRecord) return;

    const historyItem = mainUserDbRecord.bookingHistory.find(
      (b: any) => b.tokenId === this.selectedBooking?.tokenId
    );
    if (historyItem) {
      historyItem.status = 'closed';
      historyItem.closedAt = new Date().toISOString();
      historyItem.ratePerHr = this.clearData.ratePerHr;
      historyItem.totalAmount = this.clearData.totalAmount;
      historyItem.durationInHrs = this.clearData.durationHrs;
    }

    if (mainUserDbRecord.slotsStateArray) {
      const slotIndex = mainUserDbRecord.slotsStateArray.findIndex(
        (s: any) => s.id === this.selectedBooking?.slotId
      );
      if (slotIndex !== -1) {
        mainUserDbRecord.slotsStateArray[slotIndex].status = 'available';
      }
    }

    mainUserDbRecord.available = (Number(mainUserDbRecord.available) || 0) + 1;
    mainUserDbRecord.occupied = Math.max(0, (Number(mainUserDbRecord.occupied) || 0) - 1);

    localStorage.setItem('parking_users', JSON.stringify(allUsers));

    this.closePopup();
    this.clearPopup();
    this.loadAndGenerateGrid();
    this.toastService.show('Slot has been cleared successfully', 'success');

  }

  closePopup() {
    this.bookingPopup = false;
    this.selectedSlot = null;
    this.bookingData.vehicleNo = '';
    this.bookingData.ownerName = '';
  }
  clearPopup() {
    this.isClearPopupOpen = false;
    this.selectedBooking = null;
  }

  async onGenerateToken(action: any) {
    if (!this.selectedSlot) return;

    const activeUserStr = localStorage.getItem('active_parking_user');
    if (!activeUserStr) return;
    const activeUser = JSON.parse(activeUserStr);

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);
    if (!mainUserDbRecord) return;

    const slotIndex = this.parkingSlots.findIndex(s => s.id === this.selectedSlot?.id);
    if (slotIndex !== -1) {
      this.parkingSlots[slotIndex].status = 'occupied';
    }

    mainUserDbRecord.slotsStateArray = [...this.parkingSlots];

    mainUserDbRecord.available = (Number(mainUserDbRecord.available) || 0) - 1;
    mainUserDbRecord.occupied = (Number(mainUserDbRecord.occupied) || 0) + 1;

    if (!mainUserDbRecord.bookingHistory) {
      mainUserDbRecord.bookingHistory = [];
    }

    const newBookingObject = {
      tokenId: `TK-${Date.now().toString().slice(-6)}`,
      slotId: this.selectedSlot.id,
      slotNumber: this.selectedSlot.slotNumber,
      vehicleNo: this.bookingData.vehicleNo,
      ownerName: this.bookingData.ownerName,
      bookedAt: new Date().toISOString()
    };

    mainUserDbRecord.bookingHistory.push(newBookingObject);

    localStorage.setItem('parking_users', JSON.stringify(allUsers));

    this.toastService.show("Booked successfully", 'success');

    this.closePopup();
    this.router.navigate(['/history']);


    const adminName = activeUser?.name || activeUser?.username || 'Parking Management System';

    const formattedDate = new Date(newBookingObject.bookedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const tokenElement = document.createElement('div');
    tokenElement.innerHTML = `
      <div style="width: 300px; padding: 20px; font-family: Arial, sans-serif; border: 2px dashed #0284c7; border-radius: 12px; background: #ffffff; color: #1e293b; margin: auto;">
        
        <!-- Header with Management Username -->
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 15px;">
          <h2 style="margin: 0; color: #0284c7; font-size: 20px; font-weight: bold;">PARKING TOKEN</h2>
          <p style="margin: 4px 0 0; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">
            ${adminName}
          </p>
        </div>

        <!-- Slot Display -->
        <div style="background: #f0f9ff; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 15px; border: 1px solid #bae6fd;">
          <span style="font-size: 10px; text-transform: uppercase; color: #0369a1; font-weight: bold;">SLOT NUMBER</span>
          <h1 style="margin: 2px 0 0; color: #0284c7; font-size: 32px; font-weight: 800;">${newBookingObject.slotNumber}</h1>
        </div>

        <!-- Details -->
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Vehicle No:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${newBookingObject.vehicleNo}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Owner Name:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${newBookingObject.ownerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Booked At:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a; font-size: 11px;">${formattedDate}</td>
          </tr>
        </table>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 10px; color: #94a3b8;">
          <p style="margin: 0;">Keep this receipt for exit confirmation.</p>
          <p style="margin: 3px 0 0; font-weight: 600;">Have a safe parking!</p>
        </div>

      </div>
    `;

    const options = {
      margin: 10,
      filename: `Token_${newBookingObject.slotNumber}_${newBookingObject.vehicleNo}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a6', orientation: 'portrait' as const }
    };

    const html2pdf = (await import('html2pdf.js')).default;

    if (action === 'download') {
      html2pdf().set(options).from(tokenElement).save();
    } else {
      html2pdf().set(options).from(tokenElement).toPdf().get('pdf').then((pdfObj: any) => {
        pdfObj.autoPrint();
        window.open(pdfObj.output('bloburl'), '_blank');
      });
    }
  }

  private formatDateTime(date: Date): string {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  minDateTime: string = '';
  maxDateTime: string = '';

  get availableCount(): number {
    return this.parkingSlots.filter(s => s.status === 'available').length;
  }

  get occupiedCount(): number {
    return this.parkingSlots.filter(s => s.status === 'occupied').length;
  }
  get totalSlotsCount(): number {
    return this.parkingSlots ? this.parkingSlots.length : 0;
  }

  get occupiedSlotsCount(): number {
    return this.parkingSlots ? this.parkingSlots.filter(s => s.status === 'occupied').length : 0;
  }

  get availableSlotsCount(): number {
    return this.parkingSlots ? this.parkingSlots.filter(s => s.status === 'available').length : 0;
  }

}