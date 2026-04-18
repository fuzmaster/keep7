import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid deck ID' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://archidekt.com/api/decks/${id}/`, {
      headers: { 'User-Agent': 'Keep7/2.0 (deck-testing-tool)' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Archidekt returned ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    const data = await res.json();
    const name: string = data.name ?? 'Imported Deck';

    interface ArchidektCard {
      quantity: number;
      card: { oracleCard: { name: string } };
      categories: string[];
    }

    const cards: ArchidektCard[] = data.cards ?? [];
    const lines: string[] = [];
    for (const entry of cards) {
      // Skip sideboard/maybeboard
      const cats = entry.categories?.map((c: string) => c.toLowerCase()) ?? [];
      if (cats.includes('sideboard') || cats.includes('maybeboard')) continue;
      const cardName = entry.card?.oracleCard?.name;
      if (!cardName) continue;
      lines.push(`${entry.quantity} ${cardName}`);
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Deck appears empty' }, { status: 422 });
    }

    return NextResponse.json({
      deckText: lines.join('\n'),
      deckName: name,
      source: 'archidekt',
    });
  } catch {
    return NextResponse.json({ error: 'Failed to reach Archidekt' }, { status: 502 });
  }
}
