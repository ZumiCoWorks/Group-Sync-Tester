import { test, expect } from '@playwright/test';

const AUTH_TOKEN_KEY = 'afda_slot_booking_token';
const AUTH_TOKEN = 'test-staff-token';
const BACKEND_URL = 'http://localhost:3001';
const BATCH_ID = 'batch-123';

const batchResponse = {
  success: true,
  data: {
    id: BATCH_ID,
    title: 'Orientation Batch',
    description: 'A test batch for Playwright coverage.',
    venue_id: null,
    date_range_start: '2026-05-20',
    date_range_end: '2026-05-23',
    slot_duration_minutes: 30,
    per_slot_capacity: 2,
    batch_capacity: 20,
    status: 'draft',
    booking_count: 1,
    total_slots: 2,
    published_at: null,
  },
};

const bookingsResponse = {
  success: true,
  data: [
    {
      id: 'booking-1',
      slot_id: 'slot-1',
      batch_id: BATCH_ID,
      student_name: 'Ada Lovelace',
      student_email: 'ada@example.com',
      student_id_external: 'AFDA-001',
      status: 'confirmed',
      confirmation_number: 'CONF-001',
      booked_at: '2026-05-23T09:00:00.000Z',
      created_at: '2026-05-23T09:00:00.000Z',
      updated_at: '2026-05-23T09:00:00.000Z',
      marked_attended_at: null,
      slot: {
        id: 'slot-1',
        batch_id: BATCH_ID,
        start_time: '2026-05-23T10:00:00.000Z',
        end_time: '2026-05-23T10:30:00.000Z',
        capacity: 2,
        booking_count: 1,
        created_at: '2026-05-23T08:30:00.000Z',
        updated_at: '2026-05-23T08:30:00.000Z',
      },
    },
    {
      id: 'booking-2',
      slot_id: 'slot-2',
      batch_id: BATCH_ID,
      student_name: 'Grace Hopper',
      student_email: 'grace@example.com',
      student_id_external: null,
      status: 'attended',
      confirmation_number: 'CONF-002',
      booked_at: '2026-05-23T09:05:00.000Z',
      created_at: '2026-05-23T09:05:00.000Z',
      updated_at: '2026-05-23T11:00:00.000Z',
      marked_attended_at: '2026-05-23T11:00:00.000Z',
      slot: {
        id: 'slot-2',
        batch_id: BATCH_ID,
        start_time: '2026-05-23T11:00:00.000Z',
        end_time: '2026-05-23T11:30:00.000Z',
        capacity: 2,
        booking_count: 1,
        created_at: '2026-05-23T08:30:00.000Z',
        updated_at: '2026-05-23T08:30:00.000Z',
      },
    },
  ],
};

const auditLogsResponse = {
  success: true,
  data: [
    {
      id: 'audit-1',
      user_id: 'user-1',
      action: 'booking_confirmed',
      resource_type: 'batch',
      resource_id: BATCH_ID,
      details: {
        bookingId: 'booking-1',
        message: 'Booking created successfully.',
      },
      created_at: '2026-05-23T09:00:00.000Z',
    },
    {
      id: 'audit-2',
      user_id: 'user-1',
      action: 'batch_published',
      resource_type: 'batch',
      resource_id: BATCH_ID,
      details: {
        publishedBy: 'staff@example.com',
      },
      created_at: '2026-05-23T08:45:00.000Z',
    },
  ],
};

async function mockStaffBackend(page) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();

    if (pathname === '/api/auth/verify') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            tokenPayload: {
              email: 'staff@example.com',
              role: 'staff',
              name: 'Staff User',
            },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/batches' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [batchResponse.data],
        }),
      });
      return;
    }

    if (pathname === `/api/batches/${BATCH_ID}` && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(batchResponse),
      });
      return;
    }

    if (pathname === '/api/bookings' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bookingsResponse),
      });
      return;
    }

    if (pathname.startsWith('/api/bookings/') && (method === 'DELETE' || method === 'PUT')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ...bookingsResponse.data[0],
            status: method === 'DELETE' ? 'cancelled' : 'attended',
          },
        }),
      });
      return;
    }

    if (pathname === '/api/imports' && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            jobId: 'import-job-1',
            batchId: BATCH_ID,
            totalRows: 2,
            successCount: 1,
            errorCount: 1,
            status: 'completed',
            errors: [
              {
                rowNumber: 3,
                first_name: 'Marie',
                last_name: 'Curie',
                email: 'marie@example.com',
                error: 'email already has a booking in this batch',
              },
            ],
            errorReportCsv:
              'row_number,first_name,last_name,email,error\n3,Marie,Curie,marie@example.com,email already has a booking in this batch',
          },
        }),
      });
      return;
    }

    if (pathname === '/api/exports' && method === 'GET') {
      const format = searchParams.get('format');
      const filename = `orientation-batch-bookings.${format}`;
      const body =
        format === 'pdf'
          ? '%PDF-1.4\n% Playwright stub PDF\n'
          : format === 'xlsx'
            ? 'PK\x03\x04stub-xlsx'
            : 'session_id,session_date,session_time,student_name,student_email,status,attended\n';

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type':
            format === 'pdf'
              ? 'application/pdf'
              : format === 'xlsx'
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body,
      });
      return;
    }

    if (pathname === '/api/audit-logs' && method === 'GET') {
      const action = searchParams.get('action');
      const filtered = action
        ? auditLogsResponse.data.filter((entry) => entry.action === action)
        : auditLogsResponse.data;

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: filtered,
        }),
      });
      return;
    }

    if (pathname === '/api/audit-logs/export' && method === 'GET') {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="audit-logs.csv"',
        },
        body:
          'Timestamp,Action,Resource Type,Resource ID,User ID,Details\n' +
          '2026-05-23T09:00:00.000Z,booking_confirmed,batch,batch-123,user-1,"{\"bookingId\":\"booking-1\"}"',
      });
      return;
    }

    await route.fallback();
  });
}

async function openStaffEditor(page) {
  await page.addInitScript(({ key, token }) => {
    window.localStorage.setItem(key, token);
  }, { key: AUTH_TOKEN_KEY, token: AUTH_TOKEN });

  await mockStaffBackend(page);
  await page.goto(`/editor/${BATCH_ID}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'XLSX import' })).toBeVisible({ timeout: 15000 });
}

test.describe('staff workflows', () => {
  test('loads the batch editor with bookings and audit logs', async ({ page }) => {
    await openStaffEditor(page);

    await expect(page.getByText('Booking management')).toBeVisible();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();
    await expect(page.getByText('Grace Hopper')).toBeVisible();

    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'booking confirmed' })).toHaveCount(1);
    await expect(page.locator('tbody tr').filter({ hasText: 'batch published' })).toHaveCount(1);
  });

  test('imports a roster and offers the error report download', async ({ page }) => {
    await openStaffEditor(page);

    const upload = page.locator('input[type="file"]');
    await upload.setInputFiles({
      name: 'roster.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('fake-xlsx-content'),
    });

    await page.getByRole('button', { name: 'Import participants' }).click();

    await expect(page.getByText('Imported 1 participants with 1 validation issues.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download error report' })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download error report' }).click(),
    ]);

    expect(download.suggestedFilename()).toContain('import-errors-import-job-1.csv');
  });

  test('downloads exports and audit log CSV', async ({ page }) => {
    await openStaffEditor(page);

    const expectedFormats = [
      ['Download PDF', '.pdf'],
      ['Download XLSX', '.xlsx'],
      ['Download CSV', '.csv'],
    ] as const;

    for (const [buttonName, suffix] of expectedFormats) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: buttonName }).click(),
      ]);

      expect(download.suggestedFilename()).toContain(suffix);
    }

    await page.getByRole('button', { name: 'Refresh' }).click();

    const auditFilter = page.locator('select');
    await auditFilter.selectOption('booking_confirmed');
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.locator('tbody tr').filter({ hasText: 'booking confirmed' })).toHaveCount(1);

    const [auditDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download as CSV' }).click(),
    ]);

    expect(auditDownload.suggestedFilename()).toMatch(/^audit-logs-.*\.csv$/);
  });
});
