import { LeadData } from '../types/index.ts';

/**
 * Escapes CSV cell value according to RFC 4180 rules
 */
function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const stringValue = String(value);
  // If the value contains comma, double-quote, or newline, enclose in double quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/**
 * Exports an array of LeadData items into a formatted CSV file and triggers a browser download
 *
 * @param leads Array of LeadData records to export
 * @param siteFilter Optional site name to include in filename
 * @returns boolean indicating success
 */
export function exportLeadsToCsv(leads: LeadData[], siteFilter?: string | null): boolean {
  if (!leads || leads.length === 0) {
    return false;
  }

  // Define column headers
  const headers = [
    'Lead ID',
    'Source Project / Site Name',
    'Full Name',
    'Email Address',
    'Mobile Number',
    'Created At (UTC)',
    'Created At (Local Formatted)',
  ];

  // Map rows
  const rows = leads.map((lead) => {
    const dateObj = new Date(lead.createdAt);
    const localFormatted = isNaN(dateObj.getTime())
      ? lead.createdAt
      : dateObj.toLocaleString();

    return [
      escapeCsvCell(lead.id),
      escapeCsvCell(lead.siteName),
      escapeCsvCell(lead.name),
      escapeCsvCell(lead.email),
      escapeCsvCell(lead.mobile),
      escapeCsvCell(lead.createdAt),
      escapeCsvCell(localFormatted),
    ].join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\r\n');

  // Prepend UTF-8 BOM (\uFEFF) to guarantee proper character rendering in Microsoft Excel & Google Sheets
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  // Generate clean filename
  const now = new Date();
  const dateString = now.toISOString().slice(0, 10);
  const timeString = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const siteSlug = siteFilter && siteFilter.toLowerCase() !== 'all'
    ? siteFilter.replace(/[^a-zA-Z0-9_-]/g, '_')
    : 'all-projects';
  const fileName = `leads_${siteSlug}_${dateString}_${timeString}.csv`;

  // Create temporary link and click it to download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
