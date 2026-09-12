import React, { useState, useMemo } from 'react';
import { useBuild } from '../../context/BuildContext';
import { DocumentCategory, DocumentStatus, Project, ProjectDocument } from '../../types';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { AttachDocumentModal } from './AttachDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  Plus,
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  Building2,
  Clock,
  Tag,
  ArrowUpDown,
  FolderOpen,
} from 'lucide-react';

interface ProjectDocumentsTabProps {
  project: Project;
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({ project }) => {
  const { documents, deleteDocument } = useBuild();

  // Modals state
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProjectDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title' | 'size'>('newest');

  // Documents belonging to this specific project
  const projectDocs = useMemo(() => {
    return documents.filter((d) => d.project_id === project.id);
  }, [documents, project.id]);

  // Statistics calculation for the KPI cards
  const stats = useMemo(() => {
    const totalCount = projectDocs.length;
    const totalBytes = projectDocs.reduce((sum, d) => sum + (d.file_size || 0), 0);

    const blueprints = projectDocs.filter((d) => d.category === 'Blueprint');
    const contracts = projectDocs.filter((d) => d.category === 'Contract');
    const permits = projectDocs.filter((d) => d.category === 'Permit');
    const specs = projectDocs.filter((d) => d.category === 'Specification' || d.category === 'Safety & Compliance');

    return {
      totalCount,
      totalBytes,
      blueprintsCount: blueprints.length,
      blueprintsSize: blueprints.reduce((sum, d) => sum + (d.file_size || 0), 0),
      contractsCount: contracts.length,
      contractsApproved: contracts.filter((d) => d.status === 'Approved').length,
      permitsCount: permits.length,
      permitsActive: permits.filter((d) => d.status === 'Active' || d.status === 'Approved').length,
      specsCount: specs.length,
    };
  }, [projectDocs]);

  // Filtered & sorted documents list
  const filteredDocuments = useMemo(() => {
    return projectDocs
      .filter((doc) => {
        // Search query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = doc.title.toLowerCase().includes(q);
          const matchesFile = doc.file_name.toLowerCase().includes(q);
          const matchesAuth = (doc.issuing_authority || '').toLowerCase().includes(q);
          const matchesTags = (doc.tags || []).some((t) => t.toLowerCase().includes(q));
          const matchesDesc = (doc.description || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesFile && !matchesAuth && !matchesTags && !matchesDesc) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        }
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'size') {
          return (b.file_size || 0) - (a.file_size || 0);
        }
        return 0;
      });
  }, [projectDocs, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const handleDownload = (doc: ProjectDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (doc.file_data) {
      const a = window.document.createElement('a');
      a.href = doc.file_data;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    } else {
      const content = `PROJECT DOCUMENT: ${doc.title}\n=====================================\nFile: ${doc.file_name}\nProject: ${project.name} (${project.project_number})\nCategory: ${doc.category}\nVersion: ${doc.version}\nStatus: ${doc.status}\nAuthority: ${doc.issuing_authority || 'N/A'}\nUploaded By: ${doc.uploaded_by}\nDate: ${doc.uploaded_at}\n\nDescription:\n${doc.description || 'N/A'}\n\nTags: ${doc.tags?.join(', ') || 'None'}\n`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${doc.file_name.replace(/\.[^/.]+$/, '')}_details.txt`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteDocument(id);
    }
  };

  const getCategoryTheme = (cat: DocumentCategory) => {
    switch (cat) {
      case 'Blueprint':
        return {
          icon: <Compass className="w-4 h-4 text-sky-600" />,
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          badge: 'bg-sky-100 text-sky-800',
        };
      case 'Contract':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-purple-600" />,
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          badge: 'bg-purple-100 text-purple-800',
        };
      case 'Permit':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
        };
      case 'Specification':
        return {
          icon: <Layers className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          badge: 'bg-amber-100 text-amber-800',
        };
      case 'Safety & Compliance':
        return {
          icon: <ShieldCheck className="w-4 h-4 text-orange-600" />,
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'bg-orange-100 text-orange-800',
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          badge: 'bg-slate-100 text-slate-800',
        };
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Active':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Under Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Expired':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getFileExtension = (fileName: string) => {
    const ext = fileName.split('.').pop();
    return ext ? ext.toUpperCase() : 'FILE';
  };

  return (
    <div id="project-documents-tab" className="space-y-5">
      {/* 4 Bento Category KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Blueprints Card */}
        <div
          onClick={() => setSelectedCategory('Blueprint')}
          className={`bento-card p-4.5 flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all ${
            selectedCategory === 'Blueprint' ? 'ring-2 ring-sky-500 bg-sky-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Blueprints & CAD
            </span>
            <Compass className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.blueprintsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {formatFileSize(stats.blueprintsSize)} indexed drawings
          </div>
        </div>

        {/* Contracts Card */}
        <div
          onClick={() => setSelectedCategory('Contract')}
          className={`bento-card p-4.5 flex flex-col justify-between cursor-pointer hover:border-purple-400 transition-all ${
            selectedCategory === 'Contract' ? 'ring-2 ring-purple-500 bg-purple-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Contracts & Legal
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.contractsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.contractsApproved} approved agreements
          </div>
        </div>

        {/* Permits Card */}
        <div
          onClick={() => setSelectedCategory('Permit')}
          className={`bento-card p-4.5 flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition-all ${
            selectedCategory === 'Permit' ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Municipal Permits
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.permitsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {stats.permitsActive} active authorizations
          </div>
        </div>

        {/* Total Documents & Storage Card */}
        <div
          onClick={() => setSelectedCategory('all')}
          className={`bento-card p-4.5 flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all ${
            selectedCategory === 'all' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Attachments
            </span>
            <UploadCloud className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {formatFileSize(stats.totalBytes)} attached storage
          </div>
        </div>
      </div>

      {/* Main Documents Bento Container */}
      <div className="bento-card overflow-hidden">
        {/* Header and Action Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-sans flex items-center gap-2">
              <span>Project Documents & File Attachments</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {filteredDocuments.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely attach, organize, and inspect blueprints, contracts, permits, and specifications
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-attach-document"
              onClick={() => {
                setEditingDoc(null);
                setIsAttachModalOpen(true);
              }}
              className="h-9 px-3.5 rounded-lg bg-cyan-600 hover:bg-lime-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer "
            >
              <Plus className="w-4 h-4" />
              <span>Attach Document</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, file name, authority, or tag..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Controls: Category, Status, Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Categories ({stats.totalCount})</option>
              <option value="Blueprint">Blueprints ({stats.blueprintsCount})</option>
              <option value="Contract">Contracts ({stats.contractsCount})</option>
              <option value="Permit">Permits ({stats.permitsCount})</option>
              <option value="Specification">Specifications</option>
              <option value="Safety & Compliance">Safety & Compliance</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Active">Active</option>
              <option value="Under Review">Under Review</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Sort Select */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="size">Size (Largest)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clean List Layout for Documents */}
        {filteredDocuments.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'No documents match your filter criteria'
                  : 'No documents attached to this project yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try clearing your search terms or filters to view all project files.'
                  : 'Attach architectural blueprints, general contracts, city building permits, or technical specifications to centralize your project documentation.'}
              </p>
            </div>
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingDoc(null);
                  setIsAttachModalOpen(true);
                }}
                className="h-9 px-4 bg-cyan-600 hover:bg-lime-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all "
              >
                <Plus className="w-4 h-4" />
                <span>Attach First Document</span>
              </button>
            )}
          </div>
        ) : (
          /* Document List View */
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((doc) => {
              const theme = getCategoryTheme(doc.category);
              const statusBadgeClass = getStatusBadge(doc.status);
              const ext = getFileExtension(doc.file_name);
              const isExpired = doc.expiry_date ? new Date(doc.expiry_date) < new Date() : false;

              return (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="p-4 sm:p-5 hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left Column: Icon & Document Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Category Icon Box */}
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold shrink-0 border ${theme.bg} ${theme.border} group-hover:scale-105 transition-transform`}
                    >
                      {theme.icon}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Title */}
                        <h4 className="font-sans font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                          {doc.title}
                        </h4>

                        {/* File extension badge */}
                        <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded">
                          {ext}
                        </span>

                        {/* Version pill */}
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                          {doc.version}
                        </span>

                        {/* Category pill */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${theme.badge}`}
                        >
                          {doc.category}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeClass}`}
                        >
                          {doc.status}
                        </span>
                      </div>

                      {/* File Name & Authority */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-sans flex-wrap">
                        <span className="font-mono text-slate-600 truncate max-w-[280px]">
                          {doc.file_name}
                        </span>
                        {doc.issuing_authority && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">
                              Issued by: <strong>{doc.issuing_authority}</strong>
                            </span>
                          </>
                        )}
                        {doc.expiry_date && (
                          <>
                            <span>•</span>
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                              Expires: {formatDate(doc.expiry_date)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Description snippet if present */}
                      {doc.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 italic">
                          "{doc.description}"
                        </p>
                      )}

                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Metadata & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Size and Upload Details */}
                    <div className="text-right text-xs">
                      <div className="font-mono font-bold text-slate-800">
                        {formatFileSize(doc.file_size)}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {formatDate(doc.uploaded_at)} by {doc.uploaded_by.split(' ')[0]}
                      </div>
                    </div>

                    {/* Quick Action Icons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Preview & Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDownload(doc, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingDoc(doc);
                          setIsAttachModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Metadata"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attach or Edit Document Modal */}
      <AttachDocumentModal
        isOpen={isAttachModalOpen}
        onClose={() => {
          setIsAttachModalOpen(false);
          setEditingDoc(null);
        }}
        projectId={project.id}
        editDocument={editingDoc}
      />

      {/* Document Detail & Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        onEdit={(doc) => {
          setEditingDoc(doc);
          setIsAttachModalOpen(true);
        }}
        onDelete={(id) => deleteDocument(id)}
      />
    </div>
  );
};
