import React from 'react';
import { ColumnField, TableEntity } from '../model/types';

interface TableCardProps {
  table: TableEntity & { x?: number; y?: number };
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export const TableCard: React.FC<TableCardProps> = ({
  table,
  isHighlighted,
  isDimmed,
}) => {
  const getHeaderDotColor = (name: string) => {
    if (name.includes('user') || name.includes('auth')) return 'blue';
    if (name.includes('project') || name.includes('workspace')) return 'green';
    return 'amber';
  };

  const getFieldIcon = (field: ColumnField) => {
    if (field.pk) return { icon: 'key', color: 'var(--tertiary)' };
    if (field.ref) return { icon: 'link', color: 'var(--secondary)' };
    if (field.unique) return { icon: 'fingerprint', color: 'var(--primary)' };
    if (field.name.includes('date') || field.name.includes('at')) {
      return { icon: 'schedule', color: 'var(--text-muted)' };
    }
    if (field.type === 'bool' || field.type === 'boolean') {
      return { icon: 'check_box', color: 'var(--text-muted)' };
    }
    return { icon: 'notes', color: 'var(--text-muted)' };
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: table.x || 0,
        top: table.y || 0,
      }}
      className={`erd-card ${isHighlighted ? 'highlighted' : ''} ${isDimmed ? 'dimmed' : ''}`}
    >
      {/* Card Header */}
      <div className="erd-card-header">
        <div className="erd-card-title-group">
          <span className={`erd-card-dot ${getHeaderDotColor(table.name)}`} />
          <span className="erd-card-title">{table.name}</span>
        </div>
        <span className="erd-card-badge">{table.fields.length} fields</span>
      </div>

      {/* Column Fields List */}
      <div className="erd-fields-list">
        {table.fields.map((field) => {
          const { icon, color } = getFieldIcon(field);
          return (
            <div
              key={field.name}
              className={`erd-field-row ${field.ref ? 'is-fk' : ''}`}
            >
              {/* Field Name & Icon */}
              <div className="erd-field-name-group">
                <span
                  className="material-symbols-outlined"
                  style={{ color, fontSize: '13px' }}
                  title={icon}
                >
                  {icon}
                </span>
                <span
                  className={`erd-field-name ${
                    field.ref ? 'is-fk' : field.pk ? 'is-pk' : ''
                  }`}
                >
                  {field.name}
                </span>
              </div>

              {/* Field Type & Badges */}
              <div className="erd-field-type-group">
                <span className="erd-field-type">{field.type}</span>
                {field.pk && <span className="badge-pk">PK</span>}
                {field.ref && (
                  <span className="badge-fk">
                    FK &gt; {field.ref.targetTable}.{field.ref.targetColumn}
                  </span>
                )}
                {field.unique && !field.pk && <span className="badge-uniq">UNIQ</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
