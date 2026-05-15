import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './reports-export-form.html',
  styleUrl: './reports-export-form.css'
})
export class ReportExportDialogComponent {
  startDate = '';
  endDate = '';
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<ReportExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      expired?: boolean;
      expiringSoon?: boolean;
      stockedOut?: boolean;
      lowInventory?: boolean;
    }
  ) {}

  close(): void {
    this.dialogRef.close();
  }

exportCsv(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.errorMessage = 'Start date cannot be later than end date.';
      return;
    }

    this.errorMessage = '';

    this.dialogRef.close({
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    });
  }

}