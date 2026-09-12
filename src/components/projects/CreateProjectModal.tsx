import React, { useState } from 'react';
import { useBuild } from '../../context/BuildContext';
import { ProjectType, ProjectStatus } from '../../types';
import { X, Building2, Plus } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { clients, createProject, createClient } = useBuild();

  const [name, setName] = useState('');
  const [projectNumber, setProjectNumber] = useState(`PRJ-2026-${String(Math.floor(Math.random() * 900) + 100)}`);
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [newClientName, setNewClientName] = useState('');
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [type, setType] = useState<ProjectType>('Residential');
  const [buildingType, setBuildingType] = useState('Apartment');
  const [location, setLocation] = useState('Toronto, ON');
  const [floorArea, setFloorArea] = useState<number>(600);
  const [floors, setFloors] = useState<number>(3);
  const [contractValue, setContractValue] = useState<number>(1200000);
  const [approvedBudget, setApprovedBudget] = useState<number>(950000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedCompletion, setPlannedCompletion] = useState(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  );
  const [projectManager, setProjectManager] = useState('David Chen');
  const [description, setDescription] = useState(
    'Residential multi-unit modern construction featuring reinforced concrete frame and high performance insulation.'
  );
  const [status, setStatus] = useState<ProjectStatus>('Active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId = clientId;
    if (isAddingNewClient && newClientName.trim()) {
      const addedClient = createClient({
        name: newClientName.trim(),
        contact: 'Client Representative',
        email: `contact@${newClientName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: '+1 (416) 555-0100',
      });
      finalClientId = addedClient.id;
    }

    const created = createProject({
      name,
      project_number: projectNumber,
      client_id: finalClientId,
      type,
      building_type: buildingType,
      location,
      floor_area: Number(floorArea),
      floors: Number(floors),
      contract_value: Number(contractValue),
      approved_budget: Number(approvedBudget),
      start_date: startDate,
      planned_completion: plannedCompletion,
      project_manager: projectManager,
      description,
      status,
      forecast_remaining: Number(approvedBudget),
      progress: status === 'Completed' ? 100 : 0,
    });

    onSuccess(created.id);
    onClose();
  };

  // Pre-fill helper for Demonstration Scenario Step 1-2
  const applyScenarioDefaults = () => {
    setName('Riverside Modern Condominiums');
    setType('Residential');
    setBuildingType('Apartment');
    setLocation('Toronto, ON');
    setFloorArea(600);
    setFloors(3);
    setContractValue(1200000);
    setApprovedBudget(950000);
    setStatus('Active');
  };

  return (
    <div
      id="create-project-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Create Construction Project
              </h3>
              <p className="text-xs text-slate-500">
                Establish project baseline, physical dimensions, and approved budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          {/* Quick preset banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs text-amber-900 font-medium">
              Demonstration Scenario (600m² / C$1.2M Contract / C$950k Budget)
            </span>
            <button
              type="button"
              onClick={applyScenarioDefaults}
              className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
            >
              Fill Demo Values
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name *
              </label>
              <input
                id="inp-project-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riverside Modern Condominiums"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Number *
              </label>
              <input
                id="inp-project-number"
                type="text"
                required
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
              />
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Client *</label>
              <button
                type="button"
                onClick={() => setIsAddingNewClient(!isAddingNewClient)}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer"
              >
                {isAddingNewClient ? 'Select existing client' : '+ New Client'}
              </button>
            </div>

            {isAddingNewClient ? (
              <input
                id="inp-new-client-name"
                type="text"
                required={isAddingNewClient}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client or organization name"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            ) : (
              <select
                id="sel-project-client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.contact})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Type *
              </label>
              <select
                id="sel-project-type"
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Office Renovation">Office Renovation</option>
                <option value="Retail">Retail</option>
                <option value="Industrial">Industrial</option>
                <option value="Institutional">Institutional</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Building Type *
              </label>
              <input
                id="inp-building-type"
                type="text"
                required
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                placeholder="e.g. Apartment, Townhouse, Clinic"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location *
              </label>
              <input
                id="inp-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Toronto, ON"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Physical specs & Financial baselines */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor Area (m²) *
              </label>
              <input
                id="inp-floor-area"
                type="number"
                min="10"
                required
                value={floorArea}
                onChange={(e) => setFloorArea(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floors
              </label>
              <input
                id="inp-floors"
                type="number"
                min="1"
                required
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contract Value (CAD) *
              </label>
              <input
                id="inp-contract-value"
                type="number"
                min="0"
                step="1000"
                required
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approved Budget (CAD) *
              </label>
              <input
                id="inp-approved-budget"
                type="number"
                min="0"
                step="1000"
                required
                value={approvedBudget}
                onChange={(e) => setApprovedBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date *
              </label>
              <input
                id="inp-start-date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Completion *
              </label>
              <input
                id="inp-planned-completion"
                type="date"
                required
                value={plannedCompletion}
                onChange={(e) => setPlannedCompletion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Manager *
              </label>
              <input
                id="inp-project-manager"
                type="text"
                required
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                id="sel-project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm bg-white"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                id="inp-description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-project"
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-lime-500 text-white font-bold text-xs shadow-xs cursor-pointer transition-all "
            >
              Create Project & Initialize WBS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
