import { X, Plus, Save } from "lucide-react";
import { Button } from "./ui/Button";
import { FormInput, FormTextarea, FormSelect } from "./ui/FormControls";
import { PROVIDERS } from "../constants";

export const AddAgentModal = ({
  showModal,
  agentForm,
  errors,
  isEditing = false,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-100">
                {isEditing ? "Edit Agent" : "Add New Agent"}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {isEditing
                  ? "Update the configuration for this AI agent"
                  : "Configure a specialized AI agent for your pipeline"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormInput
                label="Agent Name"
                value={agentForm.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                placeholder="Agent Alpha"
                required
                error={errors.name}
              />
              <FormInput
                label="Role"
                value={agentForm.role}
                onChange={(e) => onFormChange("role", e.target.value)}
                placeholder="Data Analyst, Content Writer, etc."
                required
                error={errors.role}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormSelect
                label="Provider"
                value={agentForm.provider}
                onChange={(e) => onFormChange("provider", e.target.value)}
                options={PROVIDERS}
                required
                error={errors.provider}
              />
              <FormInput
                label="Model"
                value={agentForm.model}
                onChange={(e) => onFormChange("model", e.target.value)}
                placeholder="gpt-4, claude-3, etc. (optional)"
                error={errors.model}
              />
            </div>

            <FormTextarea
              label="System Message"
              value={agentForm.systemMsg}
              onChange={(e) => onFormChange("systemMsg", e.target.value)}
              placeholder="You are a helpful AI assistant specialized in..."
              rows={4}
              required
              error={errors.systemMsg}
            />

            <div className="flex gap-4 justify-end pt-6 border-t border-slate-700">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Update Agent
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Agent
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
