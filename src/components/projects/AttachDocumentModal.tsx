import React, { useState, useRef, useEffect } from 'react';
import { useBuild } from '../../context/BuildContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentCategory, DocumentStatus, ProjectDocument } from '../../types';
import { formatFileSize } from '../../utils/formatters';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  Tag,
  Check,
} from 'lucide-react';

interface AttachDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  editDocument?: ProjectDocument | null;
}

const CATEGORY_OPTIONS: { label: string; value: DocumentCategory; desc: string }[] = [
  { label: 'Blueprint', value: 'Blueprint', desc: 'Architectural, structural, MEP, and civil drawings' },
  { label: 'Contract', value: 'Contract', desc: 'Prime agreements, subcontracts, and change directives' },
  { label: 'Permit', value: 'Permit', desc: 'Municipal building, demolition, and environmental permits' },
  { label: 'Specification', value: 'Specification', desc: 'Technical specifications, bar schedules, and mix designs' },
  { label: 'Safety & Compliance', value: 'Safety & Compliance', desc: 'Site safety plans, OHSA compliance, and audits' },
  { label: 'Other', value: 'Other', desc: 'General project correspondence and miscellaneous files' },
];

const STATUS_OPTIONS: { label: string; value: DocumentStatus; color: string }[] = [
  { label: 'Approved', value: 'Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { label: 'Active', value: 'Active', color: 'bg-sky-100 text-sky-800 border-sky-300' },
  { label: 'Under Review', value: 'Under Review', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { label: 'Draft', value: 'Draft', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { label: 'Expired', value: 'Expired', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const AttachDocumentModal: React.FC<AttachDocumentModalProps> = ({
  isOpen,
  onClose,
  projectId,
  editDocument,
}) => {
  const { createDocument, updateDocument } = useBuild();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('Blueprint');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState('');
  const [fileData, setFileData] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState('Rev A');
  const [status, setStatus] = useState<DocumentStatus>('Approved');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or editDocument changes
  useEffect(() => {
    if (editDocument) {
      setTitle(editDocument.title);
      setCategory(editDocument.category);
      setFileName(editDocument.file_name);
      setFileSize(editDocument.file_size);
      setFileType(editDocument.file_type);
      setFileData(editDocument.file_data);
      setVersion(editDocument.version);
      setStatus(editDocument.status);
      setIssuingAuthority(editDocument.issuing_authority || '');
      setExpiryDate(editDocument.expiry_date || '');
      setDescription(editDocument.description || '');
      setTagsInput(editDocument.tags ? editDocument.tags.join(', ') : '');
    } else {
      setTitle('');
      setCategory('Blueprint');
      setFileName('');
      setFileSize(0);
      setFileType('');
      setFileData(undefined);
      setVersion('Rev A');
      setStatus('Approved');
      setIssuingAuthority('');
      setExpiryDate('');
      setDescription('');
      setTagsInput('');
    }
    setErrorMessage(null);
  }, [editDocument, isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setFileType(file.type || 'application/octet-stream');

    // Auto-populate Title if empty
    if (!title) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Auto-detect category from filename clues
    const lower = file.name.toLowerCase();
    if (lower.includes('permit') || lower.includes('approval') || lower.includes('zoning')) {
      setCategory('Permit');
      setVersion('v1.0');
    } else if (lower.includes('contract') || lower.includes('agreement') || lower.includes('ccdc')) {
      setCategory('Contract');
      setVersion('v1.0 (Executed)');
    } else if (lower.includes('dwg') || lower.includes('blueprint') || lower.includes('cad') || lower.includes('plan') || lower.includes('elevation')) {
      setCategory('Blueprint');
      setVersion('Rev A');
    } else if (lower.includes('spec') || lower.includes('calculation') || lower.includes('schedule')) {
      setCategory('Specification');
      setVersion('Rev 1.0');
    } else if (lower.includes('safety') || lower.includes('ohsa') || lower.includes('wsib') || lower.includes('hazard')) {
      setCategory('Safety & Compliance');
      setVersion('v1.0');
    }

    // Read preview data as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileData(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Please enter a document title.');
      return;
    }

    if (!fileName && !editDocument) {
      setErrorMessage('Please select or attach a project file.');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editDocument) {
      updateDocument(editDocument.id, {
        title: title.trim(),
        category,
        file_name: fileName || editDocument.file_name,
        file_size: fileSize || editDocument.file_size,
        file_type: fileType || editDocument.file_type,
        file_data: fileData || editDocument.file_data,
        version: version.trim() || 'v1.0',
        status,
        issuing_authority: issuingAuthority.trim() || undefined,
        expiry_date: expiryDate || undefined,
        description: description.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
    } else {
      createDocument({
        project_id: projectId,
        title: title.trim(),
        category,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        file_data: fileData,
        version: version.trim() || 'v1.0',
        status,
        uploaded_by: currentUser?.name || 'Project Manager',
        issuing_authority: issuingAuthority.trim() || undefined,
        expiry_date: expiryDate || undefined,
        description: description.trim() || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2">
      <div
        id="attach-document-modal"
        className="bg-white w-full max-w-[420px] rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold">
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 font-sans">
                {editDocument ? 'Edit Document Metadata' : 'Attach Document'}
              </h2>
              <p className="text-[10px] text-slate-500">
                Blueprints, contracts, permits, specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-3.5 overflow-y-auto space-y-2 text-xs">
          {errorMessage && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-1.5 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* File Dropzone Area */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
              Project File Attachment <span className="text-rose-500">*</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept=".pdf,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
            />
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-lg p-2.5 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/60'
                  : fileName
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-amber-400 hover:bg-slate-50'
              }`}
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-xs truncate max-w-[240px]">{fileName}</div>
                    <div className="text-slate-500 text-[10px]">
                      {formatFileSize(fileSize)} • {fileType || 'Document'} •{' '}
                      <span className="text-amber-600 font-semibold hover:underline">
                        Replace
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="mx-auto w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 mb-0.5">
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                  <p className="font-semibold text-slate-800 text-[11px]">
                    Drag and drop file here, or{' '}
                    <span className="text-amber-600 font-bold underline">browse</span>
                  </p>
                  <p className="text-slate-400 text-[9px]">
                    PDF, DWG/CAD, DOCX, XLSX, PNG/JPG, ZIP (Up to 50 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Working Drawings"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-sans font-semibold cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Version, Status, and Authority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Version / Rev
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g. Rev A"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DocumentStatus)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans font-semibold cursor-pointer"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Issuing Authority
              </label>
              <input
                type="text"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g. Architect"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Expiration Date and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
                Tags (Comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Phase 1, Structural"
                className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Scope Notes / Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">
              Description &amp; Notes
            </label>
            <textarea
              rows={1.5 as any}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context regarding drawings, stipulations..."
              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3.5 py-1 rounded-md bg-cyan-600 hover:bg-lime-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all "
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editDocument ? 'Save Changes' : 'Attach Document'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
