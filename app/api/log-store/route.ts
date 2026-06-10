import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'data/log.json');
const storeFilePath = path.join(process.cwd(), 'data/store.json');

const defaultData = { logs: [] };

async function migrateFromStoreJson() {
  try {
    const storeData = await fs.readFile(storeFilePath, 'utf-8');
    const parsed = JSON.parse(storeData);
    if (parsed.historyLogs?.length) {
      const migrated = { logs: parsed.historyLogs };
      await fs.writeFile(logFilePath, JSON.stringify(migrated, null, 2), 'utf-8');
      return migrated;
    }
  } catch {
    // store.json may not exist yet
  }
  return null;
}

export async function GET() {
  try {
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });

    try {
      await fs.access(logFilePath);
    } catch {
      const migrated = await migrateFromStoreJson();
      if (!migrated) {
        await fs.writeFile(logFilePath, JSON.stringify(defaultData, null, 2));
      }
    }

    const data = await fs.readFile(logFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await fs.mkdir(path.dirname(logFilePath), { recursive: true });

    await fs.writeFile(
      logFilePath,
      JSON.stringify({ logs: body.logs ?? [] }, null, 2),
      'utf-8'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
