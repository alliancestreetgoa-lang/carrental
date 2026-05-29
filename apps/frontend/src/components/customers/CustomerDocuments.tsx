'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, Plus, Loader2, FileText, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import type { CustomerDocument } from '@/lib/types';

const DOC_TYPES = ['LICENSE', 'AADHAAR', 'PASSPORT', 'PHOTO', 'OTHER'] as const;
const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer dark:bg-input/30';
const isImage = (url: string) => /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url) || url.includes('/image/upload/');

export function CustomerDocuments({
  customerId, documents, onChanged,
}: { customerId: string; documents: CustomerDocument[]; onChanged: () => void }) {
  const [type, setType] = useState<string>('LICENSE');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const createDoc = async (fileUrl: string) => {
    try {
      await api.post('/documents', { type, fileUrl, customerId });
      toast.success('Document added');
      setUrlInput('');
      onChanged();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to add document');
    }
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await createDoc(data.data.url);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Upload failed — paste a document URL instead');
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async () => {
    if (!deleteId) return;
    try { await api.delete(`/documents/${deleteId}`); toast.success('Document deleted'); onChanged(); }
    catch { toast.error('Failed to delete document'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <Input placeholder="Paste document URL" className="flex-1 min-w-[200px]" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
        <Button type="button" variant="outline" className="cursor-pointer" onClick={() => urlInput && createDoc(urlInput)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <Button type="button" className="cursor-pointer acr-liquid" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />} Upload
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Uploads are stored OCR-ready — license, Aadhaar &amp; passport scans can be auto-parsed when OCR is enabled.</p>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-border overflow-hidden group relative">
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="block h-32 bg-muted flex items-center justify-center overflow-hidden">
                {isImage(doc.fileUrl)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={doc.fileUrl} alt={doc.type} className="w-full h-full object-cover" />
                  : <FileText className="w-10 h-10 text-muted-foreground" />}
              </a>
              <div className="flex items-center justify-between p-2">
                <Badge className="bg-slate-100 text-slate-700 border-0 dark:bg-slate-800 dark:text-slate-300 text-xs">{doc.type}</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer text-red-600 hover:text-red-700" onClick={() => setDeleteId(doc.id)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete document?"
        description="This document will be removed from the customer profile."
        confirmText="Delete"
        onConfirm={deleteDoc}
      />
    </div>
  );
}
