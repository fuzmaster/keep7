import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api2.moxfield.com/v3/decks/all/${id}`, {
      headers: { 'User-Agent': 'Keep7/2.0 (deck-testing-tool)' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Moxfield returned ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    const data = await res.json();
    const name: string = data.name ?? 'Imported Deck';

    const lines: string[] = [];
    for (const section of ['commanders', 'mainboard', 'companions'] as const) {
      const board = data[section];
      if (!board || typeof board !== 'object') continue;
      for (const [cardName, entry] of Object.entries(board)) {
        const qty = (entry as { quantity?: number }).quantity ?? 1;
        lines.push(`${qty} ${cardName}`);
      }
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Deck appears empty' }, { status: 422 });
    }

    return NextResponse.json({
      deckText: lines.join('\n'),
      deckName: name,
      source: 'moxfield',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach Moxfield' }, { status: 502 });
  }
}
