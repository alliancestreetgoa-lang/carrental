'use client';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Eraser } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

export function SignatureDialog({
  open, onOpenChange, agreementId, defaultName, onSigned,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  agreementId: string;
  defaultName: string;
  onSigned: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  // Prepare the canvas bitmap when the dialog opens
  useEffect(() => {
    if (!open) return;
    // Reset the signatory name to the default each time the dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(defaultName);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    hasDrawn.current = false;
  }, [open, defaultName]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawn.current = true;
  };
  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
  };

  const submit = async () => {
    if (!hasDrawn.current) { toast.error('Please draw a signature'); return; }
    setSaving(true);
    try {
      const signatureData = canvasRef.current!.toDataURL('image/png');
      await api.patch(`/agreements/${agreementId}/sign`, { signatureData, signatoryName: name || undefined });
      toast.success('Agreement signed');
      onOpenChange(false);
      onSigned();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to sign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Agreement</DialogTitle>
          <DialogDescription>Draw the signature below to e-sign this rental agreement.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="signatory">Signatory Name</Label>
            <Input id="signatory" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Signature</Label>
            <div className="rounded-lg border border-input overflow-hidden mt-1">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                className="w-full touch-none cursor-crosshair bg-white"
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
              />
            </div>
            <button type="button" onClick={clear} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
              <Eraser className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button className="cursor-pointer acr-liquid" onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing...</> : 'Sign & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
