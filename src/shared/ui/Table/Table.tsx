import { memo, useState, type ReactNode } from "react";

const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 42;
const MAX_VIEWPORT_HEIGHT = 460;
const OVERSCAN = 5;

export interface TableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
}

interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  emptyMessage?: string;
}

function TableComponent<Row>({
  columns,
  rows,
  getRowKey,
  sortKey,
  sortDirection,
  emptyMessage = "No data to display yet.",
}: TableProps<Row>) {
  const [scrollTop, setScrollTop] = useState(0);
  if (rows.length === 0) return <p className="empty-state">{emptyMessage}</p>;
  const viewportHeight = Math.min(
    MAX_VIEWPORT_HEIGHT,
    HEADER_HEIGHT + rows.length * ROW_HEIGHT,
  );
  const visibleCount = Math.ceil((viewportHeight - HEADER_HEIGHT) / ROW_HEIGHT);
  const firstVisible = Math.min(
    Math.max(0, rows.length - visibleCount),
    Math.floor(Math.max(0, scrollTop - HEADER_HEIGHT) / ROW_HEIGHT),
  );
  const startIndex = Math.max(0, firstVisible - OVERSCAN);
  const endIndex = Math.min(
    rows.length,
    firstVisible + visibleCount + OVERSCAN,
  );
  const visibleRows = rows.slice(startIndex, endIndex);
  const topSpace = startIndex * ROW_HEIGHT;
  const bottomSpace = (rows.length - endIndex) * ROW_HEIGHT;

  return (
    <div
      className="table-scroll"
      style={{ height: viewportHeight }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                aria-sort={
                  sortKey === column.key
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topSpace > 0 && (
            <tr className="virtual-spacer" aria-hidden="true">
              <td colSpan={columns.length} style={{ height: topSpace }} />
            </tr>
          )}
          {visibleRows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
          {bottomSpace > 0 && (
            <tr className="virtual-spacer" aria-hidden="true">
              <td colSpan={columns.length} style={{ height: bottomSpace }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export const Table = memo(TableComponent) as typeof TableComponent;
