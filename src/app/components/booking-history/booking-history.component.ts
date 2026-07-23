import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../common/service/toast.service';

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
  selector: 'app-booking-history',
  templateUrl: './booking-history.component.html',
  styleUrl: './booking-history.component.scss'
})
export class BookingHistoryComponent implements OnInit {
  bookingList: Booking[] = [];
  selectedBooking: Booking | null = null;
  isClearPopupOpen: boolean = false;

  activeTab: 'current' | 'closed' | 'all' = 'current';
  currentPage: number = 1;
  pageSize: number = 5;
  searchQuery: string = '';

  clearData = {
    closedAt: '',
    durationHrs: 0,
    ratePerHr: 0,
    totalAmount: 0
  };

  constructor(private toastService: ToastService) {

  }

  ngOnInit() {
    this.loadBookingHistory();
  }

  loadBookingHistory() {
    const activeUserStr = localStorage.getItem('active_parking_user');
    if (!activeUserStr) return;
    const activeUser = JSON.parse(activeUserStr);

    const allUsersStr = localStorage.getItem('parking_users') || '[]';
    const allUsers = JSON.parse(allUsersStr);

    const mainUserDbRecord = allUsers.find((u: any) => u.mobile === activeUser.mobile);
    if (mainUserDbRecord) {
      this.clearData.ratePerHr = mainUserDbRecord.ratePerHour || 0;
      if (mainUserDbRecord.bookingHistory) {
        this.bookingList = mainUserDbRecord.bookingHistory;
      }
    }
  }

  get filteredBookingList(): Booking[] {
    if (!this.bookingList) return [];

    if (this.activeTab === 'current') {
      return this.bookingList.filter(b => !b.status || b.status !== 'closed');
    } else if (this.activeTab === 'closed') {
      return this.bookingList.filter(b => b.status === 'closed');
    } else {
      return this.bookingList;
    }
  }

  get searchedBookingList(): Booking[] {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      return this.filteredBookingList;
    }

    return this.filteredBookingList.filter(item =>
      (item.slotNumber && item.slotNumber.toLowerCase().includes(query)) ||
      (item.vehicleNo && item.vehicleNo.toLowerCase().includes(query)) ||
      (item.ownerName && item.ownerName.toLowerCase().includes(query))
    );
  }

  get paginatedBookingList(): Booking[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.searchedBookingList.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.searchedBookingList.length / this.pageSize) || 1;
  }

  onPageSizeChange() {
    this.currentPage = 1;
  }

  onSearchChange() {
    this.currentPage = 1;
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Tab change handler
  onTabChange(tabName: 'current' | 'closed' | 'all') {
    this.activeTab = tabName;
    this.currentPage = 1;
  }

  // Open Clear Popup
  openClearPopup(booking: Booking) {
    this.selectedBooking = booking;
    this.isClearPopupOpen = true;

    const currentNow = new Date();
    this.clearData.closedAt = currentNow.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const bookedTime = new Date(booking.bookedAt).getTime();
    const closedTime = currentNow.getTime();
    const diffMs = closedTime - bookedTime;

    const computedHours = Math.ceil(diffMs / (1000 * 60 * 60)) || 1;
    this.clearData.durationHrs = computedHours;

    this.calculateFinalBillAmount();
  }

  calculateFinalBillAmount() {
    const rate = Number(this.clearData.ratePerHr) || 0;
    this.clearData.totalAmount = this.clearData.durationHrs * rate;
  }

  closePopup() {
    this.isClearPopupOpen = false;
    this.selectedBooking = null;
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

    // Toggle slot state to available
    if (mainUserDbRecord.slotsStateArray) {
      const slotIndex = mainUserDbRecord.slotsStateArray.findIndex(
        (s: any) => s.id === this.selectedBooking?.slotId
      );
      if (slotIndex !== -1) {
        mainUserDbRecord.slotsStateArray[slotIndex].status = 'available';
      }
    }

    // Update global counters
    mainUserDbRecord.available = (Number(mainUserDbRecord.available) || 0) + 1;
    mainUserDbRecord.occupied = Math.max(0, (Number(mainUserDbRecord.occupied) || 0) - 1);

    localStorage.setItem('parking_users', JSON.stringify(allUsers));
    this.toastService.show("Slot been cleared successfully", 'success');
    this.loadBookingHistory();
    this.closePopup();
  }
}