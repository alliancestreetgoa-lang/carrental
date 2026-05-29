'use client';

import { useRef, useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { toast } from 'sonner';
import { FileText, Trash2, Upload, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { portalApi } from '@/lib/portalApi';
import { cn } from '@/lib/utils';

interface DocumentRow {
  id: string;
  type: string;
  fileUrl: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  LICENSE: 'Driving License',
  AADHAAR: 'Aadhaar Card',
  PASSPORT: 'Passport',
  PHOTO: 'Selfie / Photo',
  OTHER: 'Other',
};

const DOC_TYPES = [
  { value: 'LICENSE', label: 'Driving License' },
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'PHOTO', label: 'Selfie / Photo' },
  { value: 'OTHER', label: 'Other' },
];

function DocSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
      <Skeleton className="size-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
      <Skeleton className="size-8 rounded-xl" />
    </div>
  );
}

export default function DocumentsPage() {
  const [deleting, setDeleting] = useState<string | null>(null);

  // Upload form state
  const [docType, setDocType] = useState('LICENSE');
  const [fileUrl, setFileUrl] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs, loading, refetch, setData: setDocs } = useFetch<DocumentRow[]>(
    () => portalApi
      .get<{ success: boolean; data: DocumentRow[] }>('/documents')
      .then((r) => (r.data.success ? r.data.data : [])),
    [],
    [],
    () => toast.error('Failed to load documents'),
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setPasteMode(false);
    setFileUrl('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await portalApi.post<{ success: boolean; data: { url: string } }>(
        '/uploads/image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setFileUrl(res.data.data.url);
      toast.success('Image uploaded — click Save to confirm.');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) {
        setPasteMode(true);
        toast.info('Direct upload is not enabled yet — paste an image URL below.');
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fileUrl.trim()) { toast.error('Please provide an image URL.'); return; }
    setSaving(true);
    try {
      await portalApi.post('/documents', { type: docType, fileUrl: fileUrl.trim() });
      toast.success('Document saved.');
      setFileUrl('');
      setPasteMode(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      refetch();
    } catch {
      toast.error('Failed to save document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await portalApi.delete(`/documents/${id}`);
      toast.success('Document removed.');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error('Failed to delete document.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          My Documents
        </h2>
      </div>

      {/* Coming-soon note */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
        <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700">
          Drag-and-drop, OCR auto-fill and image compression are coming soon.
        </p>
      </div>

      {/* Upload section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-800">Add a document</p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Type select */}
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className={cn(
              'flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800',
              'focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 cursor-pointer'
            )}
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* File input */}
          <label
            className={cn(
              'flex-1 flex items-center gap-2 rounded-xl border border-dashed border-slate-300',
              'px-3 py-2 text-sm text-slate-500 hover:border-red-400 hover:text-red-600',
              'transition-colors cursor-pointer bg-slate-50/50'
            )}
          >
            <Upload className="size-4 shrink-0" />
            <span className="truncate">
              {uploading ? 'Uploading…' : 'Choose image'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploading || saving}
            />
          </label>
        </div>

        {/* Paste-URL fallback */}
        {pasteMode && (
          <div className="space-y-1.5">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Direct upload is not enabled yet — paste an image link instead.
            </p>
            <Input
              type="url"
              placeholder="https://example.com/my-document.jpg"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>
        )}

        {/* Preview if URL obtained from upload */}
        {fileUrl && !pasteMode && (
          <div className="flex items-center gap-3">
            {/* User-uploaded preview of an arbitrary URL — next/image needs per-domain config. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl}
              alt="preview"
              loading="lazy"
              className="size-14 rounded-xl object-cover border border-slate-200"
            />
            <p className="text-xs text-slate-500 truncate flex-1">{fileUrl}</p>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || uploading || (!fileUrl.trim())}
          className="rounded-xl acr-liquid text-sm cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save document'}
        </Button>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <DocSkeleton key={i} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
          <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText className="size-8 text-slate-400" />
          </div>
          <div className="space-y-1">
            <p className="text-slate-700 font-semibold text-lg">No documents uploaded yet</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Upload your driving license, Aadhaar or passport to speed up booking verification.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-sm transition-all"
            >
              {/* Thumbnail — user-uploaded arbitrary URL; next/image needs per-domain config. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.fileUrl}
                alt={doc.type}
                loading="lazy"
                className="size-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm">
                  {TYPE_LABELS[doc.type] ?? doc.type}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.fileUrl}</p>
              </div>

              {/* Status pill */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-100 shrink-0">
                Pending verification
              </span>

              {/* Delete */}
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deleting === doc.id}
                className="size-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Delete document"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
