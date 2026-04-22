import { Header } from '@/components/wbl/Header';
// @ts-ignore - JSX component
import TranscriptPathwayAnalyzer from '@/components/TranscriptPathwayAnalyzer';

export default function PathwayAnalyzer() {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <TranscriptPathwayAnalyzer />
    </div>
  );
}
