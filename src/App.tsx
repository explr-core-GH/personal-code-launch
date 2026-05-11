import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Resources from "./pages/Resources";
import ProgramProfileBuilder from "./pages/ProgramProfileBuilder";
import PosterBuilderList from "./pages/PosterBuilderList";
import PosterEditor from "./pages/PosterEditor";
import PathwayAnalyzer from "./pages/PathwayAnalyzer";
import ProgramRiasecCoder from "./pages/ProgramRiasecCoder";
import MinecraftExport from "./pages/MinecraftExport";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/program-profiles" element={<ProgramProfileBuilder />} />
          <Route path="/program-riasec" element={<ProgramRiasecCoder />} />
          <Route path="/poster-builder" element={<PosterBuilderList />} />
          <Route path="/poster-builder/:id" element={<PosterEditor />} />
          <Route path="/pathway-analyzer" element={<PathwayAnalyzer />} />
          <Route path="/minecraft-export" element={<MinecraftExport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
