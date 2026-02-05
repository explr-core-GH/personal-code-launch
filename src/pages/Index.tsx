import { Header } from '@/components/wbl/Header';
import { ToolsTabs } from '@/components/tools/ToolsTabs';

const Index = () => {
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <Header />
      <ToolsTabs />
    </div>
  );
};

export default Index;
