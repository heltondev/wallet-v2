import type { Workspace } from '../types';
import './WorkspaceSelector.scss';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function WorkspaceSelector({ workspaces, activeId, onChange }: WorkspaceSelectorProps) {
  if (workspaces.length === 0) return null;

  const owned = [...workspaces].filter(w => w.ownership !== 'shared').sort((a, b) => a.order - b.order);
  const shared = [...workspaces].filter(w => w.ownership === 'shared').sort((a, b) => a.order - b.order);

  return (
    <div className="workspace-selector">
      <div className="workspace-selector__track no-scrollbar">
        {owned.length > 0 && (
          <button
            className={`workspace-selector__pill ${activeId === null ? 'workspace-selector__pill--active' : ''}`}
            onClick={() => onChange(null)}
          >
            Todos
          </button>
        )}
        {owned.map(ws => (
          <button
            key={ws.id}
            className={`workspace-selector__pill ${activeId === ws.id ? 'workspace-selector__pill--active' : ''}`}
            onClick={() => onChange(ws.id)}
          >
            {ws.icon && <span className="workspace-selector__icon">{ws.icon}</span>}
            {ws.name}
          </button>
        ))}
        {shared.length > 0 && <span className="workspace-selector__separator" />}
        {shared.map(ws => (
          <button
            key={ws.id}
            className={`workspace-selector__pill workspace-selector__pill--shared ${activeId === ws.id ? 'workspace-selector__pill--active' : ''}`}
            onClick={() => onChange(ws.id)}
          >
            {ws.icon && <span className="workspace-selector__icon">{ws.icon}</span>}
            {ws.name}
          </button>
        ))}
      </div>
    </div>
  );
}
