import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'data/store.json');

const defaultData = {
  members: [],
  products: [],
  bills: [],
  dailySummaries: [],
  settings: {
    retentionMonths: 3,
    reminderExport: true,
    lastExportDate: '',
  },
  lastCleanup: '',
};

export async function GET() {
  try {
    await fs.mkdir(path.dirname(filePath), {
      recursive: true,
    });

    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(
        filePath,
        JSON.stringify(defaultData, null, 2)
      );
    }

    const data = await fs.readFile(filePath, 'utf-8');

    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await fs.mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await fs.writeFile(
      filePath,
      JSON.stringify(body, null, 2),
      'utf-8'
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}