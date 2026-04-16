interface EditorTabsProps {
  tabs: Array<{
    key: string;
    label: string;
  }>;
  activeTab: string;
  onChange: (tabKey: string) => void;
}

export default function EditorTabs({
  tabs,
  activeTab,
  onChange,
}: EditorTabsProps) {
  return (
    <div className="editor-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`editor-tab ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}