import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, Download, Loader2, Upload } from 'lucide-react';
import { Header } from '@/components/wbl/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ModelPreview } from '@/components/minecraft/ModelPreview';
import { optimizeGlb, type OptimizerStats } from '@/lib/minecraft/glbOptimizer';
import { optimizeMcstructure } from '@/lib/minecraft/mcstructure';
import { optimizeSchem } from '@/lib/minecraft/schem';
import { PALETTE_PRESETS, type ColorPalette } from '@/lib/minecraft/blockColors';
import type { OptimizeOptions, StructureOptimizerStats } from '@/lib/minecraft/voxelPipeline';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'processing' | 'ready' | 'error';
type SourceFormat = 'glb' | 'mcstructure' | 'schem';

type ExtendedStats = OptimizerStats &
  Partial<Omit<StructureOptimizerStats, keyof OptimizerStats>> & {
    sourceFormat?: SourceFormat;
  };

interface UploadedFile {
  name: string;
  buffer: ArrayBuffer;
  format: SourceFormat;
}

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

function detectFormat(filename: string): SourceFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.glb')) return 'glb';
  if (lower.endsWith('.mcstructure')) return 'mcstructure';
  if (lower.endsWith('.schem')) return 'schem';
  return null;
}

const MinecraftExport = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [palette, setPalette] = useState<ColorPalette>('classic');
  const [removeGround, setRemoveGround] = useState(false);
  const [cropToBuilding, setCropToBuilding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const options: OptimizeOptions = useMemo(
    () => ({ palette, removeGround, cropToBuilding }),
    [palette, removeGround, cropToBuilding],
  );

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

  const process = useCallback(
    async (file: UploadedFile, opts: OptimizeOptions, silent = false) => {
      setStatus('processing');
      setError(null);
      try {
        const optimized =
          file.format === 'glb'
            ? await optimizeGlb(file.buffer.slice(0))
            : file.format === 'mcstructure'
            ? await optimizeMcstructure(file.buffer.slice(0), opts)
            : await optimizeSchem(file.buffer.slice(0), opts);
        const baseName = file.name.replace(/\.(glb|mcstructure|schem)$/i, '');
        setResult({
          fileName: `${baseName}-optimized.glb`,
          scene: optimized.scene,
          glb: optimized.glb,
          stats: optimized.stats as ExtendedStats,
        });
        setStatus('ready');
        if (!silent) toast.success('Optimization complete!');
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setStatus('error');
        toast.error('Could not process this file.');
      }
    },
    [],
  );

  const handleFile = useCallback(
    async (file: File) => {
      const format = detectFormat(file.name);
      if (!format) {
        toast.error('Upload a .glb, .mcstructure, or .schem file.');
        return;
      }
      const buffer = await file.arrayBuffer();
      const uploadedFile: UploadedFile = { name: file.name, buffer, format };
      setUploaded(uploadedFile);
      setResult(null);
      await process(uploadedFile, options);
    },
    [options, process],
  );

  // Re-process when options change (and a file is loaded).
  useEffect(() => {
    if (!uploaded) return;
    if (uploaded.format === 'glb') return; // glb path ignores these options
    process(uploaded, options, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette, removeGround, cropToBuilding]);

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

  const optionsApplyToCurrent = uploaded && uploaded.format !== 'glb';

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
            Upload a <code className="text-foreground">.glb</code>,{' '}
            <code className="text-foreground">.mcstructure</code>, or{' '}
            <code className="text-foreground">.schem</code> file and download an optimized version
            ready to import into DelightEx (CoSpaces).
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Where do these files come from?</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                <strong>.glb</strong> — Structure Block "3D Export" mode in Minecraft Education.
                Best quality (real textures).
              </p>
              <p>
                <strong>.mcstructure</strong> — Structure Block "Save" mode in Bedrock / Education.
                Colored by block type.
              </p>
              <p>
                <strong>.schem</strong> — Java Edition with WorldEdit, Litematica, or other editors.
                Colored by block type.
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
            accept=".glb,.mcstructure,.schem,model/gltf-binary"
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
                  Drop your .glb, .mcstructure, or .schem file here
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

        {result && status !== 'error' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>
                  Drag to rotate, scroll to zoom. This is the optimized model you'll download.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[480px] rounded-md overflow-hidden border border-border relative">
                  <ModelPreview scene={result.scene} className="w-full h-full" />
                  {status === 'processing' && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {optionsApplyToCurrent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="palette-select" className="text-sm">
                        Color palette
                      </Label>
                      <Select
                        value={palette}
                        onValueChange={(v) => setPalette(v as ColorPalette)}
                      >
                        <SelectTrigger id="palette-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PALETTE_PRESETS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="remove-ground"
                        checked={removeGround}
                        onCheckedChange={(v) => setRemoveGround(v === true)}
                      />
                      <Label htmlFor="remove-ground" className="text-sm cursor-pointer leading-snug">
                        Remove ground
                        <span className="block text-xs text-muted-foreground font-normal">
                          Skips dirt, grass, sand, gravel, etc. so the build doesn't sit on
                          terrain.
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="crop-building"
                        checked={cropToBuilding}
                        onCheckedChange={(v) => setCropToBuilding(v === true)}
                      />
                      <Label htmlFor="crop-building" className="text-sm cursor-pointer leading-snug">
                        Crop to building
                        <span className="block text-xs text-muted-foreground font-normal">
                          Re-centers the model on the visible blocks so empty space around it is
                          gone.
                        </span>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Result</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {result.stats.sourceFormat === 'glb' ? (
                    <>
                      <StatRow
                        label="File size"
                        before={formatBytes(result.stats.inputBytes)}
                        after={formatBytes(result.stats.outputBytes)}
                        delta={formatPercent(result.stats.inputBytes, result.stats.outputBytes)}
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
                  ) : (
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
                      {(result.stats.removedGroundBlocks ?? 0) > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Ground blocks removed</span>
                          <span>{result.stats.removedGroundBlocks?.toLocaleString()}</span>
                        </div>
                      )}
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
