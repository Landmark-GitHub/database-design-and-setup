import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const expensesFilePath = path.join(process.cwd(), 'data/expenses.json');
const storeFilePath = path.join(process.cwd(), 'data/store.json');

const defaultData = {
  expenseCategories: [],
  expenses: [],
};

async function migrateFromStoreJson() {
  try {
    const storeData = await fs.readFile(storeFilePath, 'utf-8');
    const parsed = JSON.parse(storeData);
    if (parsed.expenseCategories?.length || parsed.expenses?.length) {
      const migrated = {
        expenseCategories: parsed.expenseCategories || [],
        expenses: parsed.expenses || [],
      };
      await fs.writeFile(expensesFilePath, JSON.stringify(migrated, null, 2), 'utf-8');
      return migrated;
    }
  } catch {
    // store.json may not exist yet
  }
  return null;
}

export async function GET() {
  try {
    await fs.mkdir(path.dirname(expensesFilePath), { recursive: true });

    try {
      await fs.access(expensesFilePath);
    } catch {
      const migrated = await migrateFromStoreJson();
      if (!migrated) {
        await fs.writeFile(
          expensesFilePath,
          JSON.stringify(defaultData, null, 2)
        );
      }
    }

    const data = await fs.readFile(expensesFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await fs.mkdir(path.dirname(expensesFilePath), { recursive: true });

    await fs.writeFile(
      expensesFilePath,
      JSON.stringify(
        {
          expenseCategories: body.expenseCategories ?? [],
          expenses: body.expenses ?? [],
        },
        null,
        2
      ),
      'utf-8'
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
