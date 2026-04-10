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
    @Inject(MAT_DIALOG_DATA) public data: { rows: any[] }
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

    let rows = this.data.rows;

    if (this.startDate || this.endDate) {
      const start = this.startDate ? new Date(this.startDate) : null;
      const end = this.endDate ? new Date(this.endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      rows = rows.filter(item => {
        if (!item.expiration) return false;

        const expirationDate = new Date(item.expiration);
        expirationDate.setHours(0, 0, 0, 0);

        if (start && expirationDate < start) return false;
        if (end && expirationDate > end) return false;

        return true;
      });
    }

    const headers = [
      'Medication Name',
      'Generic Name',
      'National Drug Code',
      'Form',
      'Strength',
      'Package NDC',
      'Package Description',
      'Quantity',
      'Reorder Point',
      'Bin Location',
      'Lot',
      'Expiration',
      'Beyond Use Date'
    ];

    const csvRows = rows.map(item => [
      item.medicationName ?? '',
      item.genericName ?? '',
      item.nationalDrugCode ?? '',
      item.form ?? '',
      item.strength ?? '',
      item.packageNdc ?? '',
      item.packageDescription ?? '',
      item.quantity ?? '',
      item.reorderPoint ?? '',
      item.binLocation ?? '',
      item.lot ?? '',
      item.expiration ?? '',
      item.beyondUseDate ?? ''
    ]);

    const csvContent = [headers, ...csvRows]
      .map(row =>
        row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.dialogRef.close();
  }
}