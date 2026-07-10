import AppHeader from '@/shared/ui/AppHeader';
import StatusBar from '@/shared/ui/StatusBar';
import { SyncPanel } from '@/features/rule-sync/ui/SyncPanel';
import { IncidentForm } from '@/features/incident-resolver/ui/IncidentForm';
import { KnowledgeGraph } from '@/features/knowledge-graph/ui/KnowledgeGraph';
import { TraceTerminal } from '@/features/trace-terminal/ui/TraceTerminal';

export default function Home() {
  return (
    <div className="bg-[#0B0F19] min-h-screen text-slate-100 flex flex-col font-sans">
      <AppHeader />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 items-start">
        {/* COLUMN 1: OPERATIONAL CONTROLS (Left Panel) - Spans 4 of 12 columns */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <SyncPanel />
          <IncidentForm />
        </div>

        {/* COLUMN 2: BUSINESS RULE TOPOLOGY (Center Panel) - Spans 4 of 12 columns */}
        <div className="flex flex-col lg:col-span-4">
          <KnowledgeGraph />
        </div>

        {/* COLUMN 3: AGENT EXECUTION TRACE (Right Panel) - Spans 4 of 12 columns */}
        <div className="flex flex-col lg:col-span-4">
          <TraceTerminal />
        </div>
      </main>

      <StatusBar />
    </div>
  );
}

