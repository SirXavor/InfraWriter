import yaml from "yaml";
import type { Host } from "../../features/hosts/host.types";

interface YamlPreviewSectionProps {
  data: Host;
}

export default function YamlPreviewSection({
  data,
}: YamlPreviewSectionProps) {
  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Preview YAML</h3>
      <pre className="editor-preview">{yaml.stringify(data)}</pre>
    </section>
  );
}