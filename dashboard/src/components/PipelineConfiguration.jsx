import { FileText } from "lucide-react";
import { Card } from "./ui/Card";
import { FormInput, FormTextarea } from "./ui/FormControls";

export const PipelineConfiguration = ({
  pipelineForm,
  onFormChange,
  errors,
}) => (
  <Card
    title="Pipeline Configuration"
    subtitle="Define the core settings for your AI agent pipeline"
    icon={<FileText className="w-5 h-5" />}
  >
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FormInput
        label="Pipeline Name"
        value={pipelineForm.name}
        onChange={(e) => onFormChange("name", e.target.value)}
        placeholder="My AI Pipeline"
        required
        error={errors.name}
      />
      <div className="lg:col-span-2">
        <FormTextarea
          label="Initial Prompt"
          value={pipelineForm.firstPrompt}
          onChange={(e) => onFormChange("firstPrompt", e.target.value)}
          placeholder="Enter the initial prompt that will be processed through your agent pipeline..."
          rows={4}
          required
          error={errors.firstPrompt}
        />
      </div>
    </div>
  </Card>
);
