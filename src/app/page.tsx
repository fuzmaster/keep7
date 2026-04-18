'use client';

import { AppProvider, useApp } from '@/hooks/useAppContext';
import { Header } from '@/components/Header';
import { HandTest } from '@/components/HandTest';
import { Goldfish } from '@/components/Goldfish';
import { Race } from '@/components/Race';
import { ZoomModal } from '@/components/ZoomModal';

function AppContent() {
  const { mode } = useApp();

  return (
    <>
      <Header />
      <main>
        <div id="panel-handtest" role="tabpanel" aria-labelledby="tab-handtest" hidden={mode !== 'handtest'}>
          {mode === 'handtest' && <HandTest />}
        </div>
        <div id="panel-goldfish" role="tabpanel" aria-labelledby="tab-goldfish" hidden={mode !== 'goldfish'}>
          {mode === 'goldfish' && <Goldfish />}
        </div>
        <div id="panel-race" role="tabpanel" aria-labelledby="tab-race" hidden={mode !== 'race'}>
          {mode === 'race' && <Race />}
        </div>
      </main>
      <ZoomModal />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
