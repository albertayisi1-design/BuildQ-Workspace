import React from 'react';
import { ProjectDocument } from '../../types';
import { formatFileSize, formatDate } from '../../utils/formatters';
import {
  X,
  Download,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  ShieldCheck,
  Building2,
  FileText,
  Clock,
  Compass,
  FileCode,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProjectDocument | null;
  onEdit: (doc: ProjectDocument) => void;
  onDelete: (id: string) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !document) return null;

  const isExpired = document.expiry_date ? new Date(document.expiry_date) < new Date() : false;

  const handleDownload = () => {
    if (document.file_data) {
      const a = window.document.createElement('a');
      a.href = document.file_data;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } else {
      // Create a downloadable summary blob for documents that don't have stored binary data
      const content = `BUILDING DOCUMENT MANIFEST\n========================\n\nTitle: ${document.title}\nCategory: ${document.category}\nFile Name: ${document.file_name}\nVersion: ${document.version}\nStatus: ${document.status}\nIssuing Authority: ${document.issuing_authority || 'N/A'}\nUploaded By: ${document.uploaded_by}\nUploaded At: ${document.uploaded_at}\nExpiry Date: ${document.expiry_date || 'N/A'}\nFile Size: ${formatFileSize(document.file_size)}\n\nScope & Notes:\n${document.description || 'No additional notes provided.'}\n\nTags: ${document.tags?.join(', ') || 'N/A'}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${document.file_name.replace(/\.[^/.]+$/, '')}_manifest.txt`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove "${document.title}" from this project?`)) {
      onDelete(document.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="document-preview-modal"
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                document.category === 'Blueprint'
                  ? 'bg-sky-500/10 text-sky-600'
                  : document.category === 'Contract'
                  ? 'bg-purple-500/10 text-purple-600'
                  : document.category === 'Permit'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : document.category === 'Specification'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-slate-500/10 text-slate-600'
              }`}
            >
              {document.category === 'Blueprint' ? (
                <Compass className="w-5 h-5" />
              ) : document.category === 'Contract' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : document.category === 'Permit' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {document.version}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    document.status === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : document.status === 'Active'
                      ? 'bg-sky-100 text-sky-800'
                      : document.status === 'Under Review'
                      ? 'bg-amber-100 text-amber-800'
                      : document.status === 'Expired'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {document.status}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {document.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 truncate mt-0.5 font-sans">
                {document.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => {
                onEdit(document);
                onClose();
              }}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Edit Details"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors cursor-pointer"
              title="Delete Document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body with 2-Column Split: Interactive Viewer on Left, Metadata on Right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Column: Document Visual Representation */}
          <div className="lg:col-span-7 p-6 bg-slate-100/80 flex flex-col justify-center items-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[300px] lg:min-h-[440px]">
            {/* Architectural Grid Background Texture */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#0891b2 1px, transparent 1px), radial-gradient(#0891b2 1px, #f1f5f9 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px',
              }}
            />

            {/* If there's an actual image data URL */}
            {document.file_data && document.file_type.startsWith('image/') ? (
              <img
                src={document.file_data}
                alt={document.title}
                className="max-h-[380px] max-w-full rounded-lg object-contain shadow-xl z-10 border border-slate-200 bg-white"
              />
            ) : (
              /* High-fidelity Blueprint / Contract Drawing Sheet Mockup */
              <div className="w-full max-w-md bg-white border-2 border-cyan-500/40 rounded-xl p-6 shadow-xl text-slate-800 font-mono text-xs relative z-10 space-y-4">
                {/* Header Title Block */}
                <div className="flex items-center justify-between border-b border-cyan-200 pb-3">
                  <div>
                    <div className="text-[10px] text-cyan-700 font-bold uppercase tracking-widest ">
                      BUILDSUITE SPECIFICATION SHEET
                    </div>
                    <div className="text-slate-900 font-bold text-sm tracking-wide mt-0.5 truncate max-w-[280px]">
                      {document.title}
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-cyan-50 border border-cyan-300 text-cyan-800 rounded text-[11px] font-bold">
                    {document.version}
                  </span>
                </div>

                {/* Technical schematic preview diagram lines */}
                <div className="h-32 border border-dashed border-cyan-300 rounded-lg flex items-center justify-center p-3 relative bg-cyan-50/50">
                  <div className="text-center space-y-1 text-slate-600">
                    <Compass className="w-8 h-8 text-cyan-600 mx-auto animate-pulse" />
                    <div className="text-[11px] text-cyan-800 font-semibold">{document.file_name}</div>
                    <div className="text-[10px] text-slate-500">
                      Format: {document.file_type || 'CAD/PDF'} • {formatFileSize(document.file_size)}
                    </div>
                  </div>
                  {/* Corner dimension ticks */}
                  <span className="absolute top-1 left-1 text-[9px] text-cyan-600/70 font-mono">0.00</span>
                  <span className="absolute bottom-1 right-1 text-[9px] text-cyan-600/70 font-mono">1:100 SCALE</span>
                </div>

                {/* Stamp block */}
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-cyan-200 text-slate-600">
                  <div>AUTHORITY: {document.issuing_authority || 'ARCHITECTURAL BOARD'}</div>
                  <div className="text-emerald-600 font-bold uppercase">● {document.status}</div>
                </div>
              </div>
            )}

            <div className="mt-4 z-10 flex items-center gap-2 text-slate-500 text-xs">
              <span>{document.file_name}</span>
              <span>•</span>
              <span>{formatFileSize(document.file_size)}</span>
            </div>
          </div>

          {/* Right Column: Detailed Metadata Inspector */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-white text-xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Document Metadata
              </h3>
              <dl className="space-y-3 font-sans">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Category</span>
                  </dt>
                  <dd className="font-bold text-slate-900">{document.category}</dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Status</span>
                  </dt>
                  <dd>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        document.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : document.status === 'Active'
                          ? 'bg-sky-100 text-sky-800'
                          : document.status === 'Under Review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {document.status}
                    </span>
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Revision / Version</span>
                  </dt>
                  <dd className="font-mono font-bold text-slate-800">{document.version}</dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Issuing Authority</span>
                  </dt>
                  <dd className="font-medium text-slate-900 text-right max-w-[180px] truncate">
                    {document.issuing_authority || 'Not Specified'}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Uploaded Date</span>
                  </dt>
                  <dd className="font-medium text-slate-700 font-mono">
                    {formatDate(document.uploaded_at)}
                  </dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">Uploaded By</dt>
                  <dd className="font-semibold text-slate-800">{document.uploaded_by}</dd>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500">File Size</dt>
                  <dd className="font-mono font-bold text-slate-800">
                    {formatFileSize(document.file_size)} ({document.file_size.toLocaleString()} bytes)
                  </dd>
                </div>

                {document.expiry_date && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <dt className="text-slate-500 flex items-center gap-1.5">
                      {isExpired ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Expiry Date</span>
                    </dt>
                    <dd className={`font-mono font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatDate(document.expiry_date)} {isExpired && '(Expired)'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Description / Scope Notes */}
            {document.description && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Scope Notes & Remarks
                </h3>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed text-xs">
                  {document.description}
                </div>
              </div>
            )}

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Index Tags</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
