import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, Download, Loader2, Upload } from 'lucide-react';
import { Header } from '@/components/wbl/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ModelPreview } from '@/components/minecraft/ModelPreview';
import { optimizeGlb, type OptimizerStats } from '@/lib/minecraft/glbOptimizer';
import { optimizeMcstructure } from '@/lib/minecraft/mcstructure';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'processing' | 'ready' | 'error';

type ExtendedStats = OptimizerStats & {
  inputBlocks?: number;
  paletteEntries?: number;
  sourceFormat?: 'glb' | 'mcstructure';
};

interface Result {
  fileName: string;
  scene: THREE.Group;
  glb: ArrayBuffer;
  stats: ExtendedStats;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatPercent(before: number, after: number): string {
  if (before === 0) return '—';
  const pct = ((before - after) / before) * 100;
  if (pct <= 0) return '+0%';
  return `−${pct.toFixed(0)}%`;
}

const MinecraftExport = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      result?.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m.dispose();
        }
      });
    };
  }, [result]);

  const handleFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase();
    const isGlb = lower.endsWith('.glb');
    const isMcStructure = lower.endsWith('.mcstructure');
    if (!isGlb && !isMcStructure) {
      toast.error('Please upload a .glb or .mcstructure file from Minecraft Education.');
      return;
    }
    setStatus('processing');
    setError(null);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const optimized = isGlb
        ? await optimizeGlb(buffer)
        : await optimizeMcstructure(buffer);
      const baseName = file.name.replace(/\.(glb|mcstructure)$/i, '');
      setResult({
        fileName: `${baseName}-optimized.glb`,
        scene: optimized.scene,
        glb: optimized.glb,
        stats: optimized.stats as ExtendedStats,
      });
      setStatus('ready');
      toast.success('Optimization complete!');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStatus('error');
      toast.error('Could not process this file.');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const onDownload = () => {
    if (!result) return;
    const blob = new Blob([result.glb], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Header />
      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Box className="w-8 h-8 text-primary" />
            Minecraft → DelightEx Exporter
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload a <code className="text-foreground">.glb</code> or{' '}
            <code className="text-foreground">.mcstructure</code> file from a Minecraft Education
            Structure Block, and download an optimized version ready to import into DelightEx
            (CoSpaces).
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">How to get a file from Minecraft Education</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                In your world, give yourself a structure block with{' '}
                <code className="text-foreground">/give @p structure_block</code>, place it next to
                your build, and set the size to enclose it.
              </p>
              <p>
                <strong>For best results,</strong> set the mode to{' '}
                <strong>3D Export</strong> and click <strong>Export</strong> — you'll get a{' '}
                <code>.glb</code> with the real Minecraft textures.
              </p>
              <p>
                <strong>Or:</strong> use <strong>Save</strong> mode and click <strong>Export</strong>{' '}
                — you'll get a <code>.mcstructure</code> file. The exporter will color each block
                type and convert it to a glb for you (no textures, just solid colors).
              </p>
            </CardDescription>
          </CardHeader>
        </Card>

        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/60 hover:bg-muted/30',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".glb,.mcstructure,model/gltf-binary"
            className="hidden"
            onChange={onChange}
          />
          {status === 'processing' ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>Optimizing your model...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Upload className="w-8 h-8" />
              <div>
                <p className="font-medium text-foreground">
                  Drop your Minecraft .glb or .mcstructure file here
                </p>
                <p className="text-sm mt-1">or click to choose a file</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Could not process this file</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && status === 'ready' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>
                  Drag to rotate, scroll to zoom. This is the optimized model you'll download.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[480px] rounded-md overflow-hidden border border-border">
                  <ModelPreview scene={result.scene} className="w-full h-full" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {result.stats.sourceFormat === 'mcstructure' ? (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Output .glb size</span>
                        <span>{formatBytes(result.stats.outputBytes)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Blocks placed</span>
                        <span>{result.stats.inputBlocks?.toLocaleString() ?? '—'}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Output triangles</span>
                        <span>{result.stats.outputTriangles.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <StatRow
                        label="File size"
                        before={formatBytes(result.stats.inputBytes)}
                        after={formatBytes(result.stats.outputBytes)}
                        delta={formatPercent(
                          result.stats.inputBytes,
                          result.stats.outputBytes,
                        )}
                      />
                      <StatRow
                        label="Triangles"
                        before={result.stats.inputTriangles.toLocaleString()}
                        after={result.stats.outputTriangles.toLocaleString()}
                        delta={formatPercent(
                          result.stats.inputTriangles,
                          result.stats.outputTriangles,
                        )}
                      />
                    </>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Block types</span>
                    <span>{result.stats.materialGroups}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Visible voxel faces</span>
                    <span>{result.stats.voxelFaces.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" size="lg" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download optimized .glb
              </Button>

              <p className="text-xs text-muted-foreground">
                Next: open DelightEx, go to your CoSpace, click <strong>Upload</strong> →{' '}
                <strong>3D models</strong>, and drop the downloaded file in.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function StatRow({
  label,
  before,
  after,
  delta,
}: {
  label: string;
  before: string;
  after: string;
  delta: string;
}) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-xs">
        <span className="text-muted-foreground line-through mr-2">{before}</span>
        <span className="text-foreground">{after}</span>
        <span className="text-primary ml-2">{delta}</span>
      </span>
    </div>
  );
}

export default MinecraftExport;
