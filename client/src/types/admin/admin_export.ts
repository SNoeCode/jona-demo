export type ExportFormat = 'csv' | 'json' | 'xlsx';

export interface ExportOptions {
  format: ExportFormat;
  include_usage?: boolean;
  include_payment_history?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}
