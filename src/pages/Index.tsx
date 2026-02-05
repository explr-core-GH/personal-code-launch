import { Header } from '@/components/wbl/Header';
import { ToolsTabs } from '@/components/tools/ToolsTabs';

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <ToolsTabs />
    </div>
  );
};

export default Index;
