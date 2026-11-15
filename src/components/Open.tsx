import { useMemo, useState } from 'react';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { SvgPath } from '../lib/svg';
import { useEditor } from '../editor/EditorProvider';
import { AppTooltip } from './AppTooltip';
import { RaisedButton } from './buttons';

type SortColumn = 'name' | 'create' | 'change';

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  };
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function viewbox(path: string): string {
  const p = new SvgPath(path);
  const locs = p.targetLocations();
  if (locs.length > 0) {
    const minx = locs.reduce((acc, pt) => Math.min(acc, pt.x), Infinity);
    const miny = locs.reduce((acc, pt) => Math.min(acc, pt.y), Infinity);
    const maxx = locs.reduce((acc, pt) => Math.max(acc, pt.x), -Infinity);
    const maxy = locs.reduce((acc, pt) => Math.max(acc, pt.y), -Infinity);
    return `${minx} ${miny} ${maxx - minx} ${maxy - miny}`;
  }
  return `0 0 0 0`;
}

interface OpenDialogProps {
  open: boolean;
  onClose: (name?: string) => void;
}

export function OpenDialog({ open, onClose }: OpenDialogProps) {
  const store = useEditor();
  const [sort, setSort] = useState<{ column: SortColumn; direction: 'asc' | 'desc' } | null>(null);
  const [beingRemoved, setBeingRemoved] = useState<string | undefined>(undefined);
  const [refresh, setRefresh] = useState(0);

  const rows = useMemo(
    () => store.storage.storedPaths.filter((it) => !!it.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, refresh, store.storage.storedPaths],
  );

  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows;
    }
    const accessor = (row: (typeof rows)[number]) => {
      if (sort.column === 'change') {
        return new Date(row.changeDate).getTime();
      }
      if (sort.column === 'create') {
        return new Date(row.creationDate).getTime();
      }
      return row.name || '';
    };
    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (av > bv) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [rows, sort]);

  const handleSort = (column: SortColumn) => {
    setSort((previous) => {
      if (previous?.column !== column) {
        return { column, direction: 'asc' };
      }
      if (previous.direction === 'asc') {
        return { column, direction: 'desc' };
      }
      return null;
    });
  };

  const sortLabel = (column: SortColumn, label: string) => (
    <TableSortLabel
      active={sort?.column === column}
      direction={sort?.column === column ? sort.direction : 'asc'}
      onClick={() => handleSort(column)}
    >
      {label}
    </TableSortLabel>
  );

  const onRemove = (name: string) => {
    store.storage.removePath(name);
    store.emit();
    setBeingRemoved(undefined);
    setRefresh((value) => value + 1);
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose()}
      maxWidth={false}
      disableAutoFocus
      slotProps={{
        paper: { sx: { width: 800, maxWidth: '80vw' } },
      }}
    >
      <DialogTitle>Open path</DialogTitle>
      <DialogContent>
        <Table className="open-dialog-table">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 74 }} />
              <TableCell>{sortLabel('name', 'Name')}</TableCell>
              <TableCell style={{ width: 180 }}>{sortLabel('create', 'Creation Date')}</TableCell>
              <TableCell style={{ width: 180 }}>{sortLabel('change', 'Change Date')}</TableCell>
              <TableCell style={{ width: 122 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow
                key={row.name}
                hover
                className="clickable-row"
                onClick={() => row.name && onClose(row.name)}
              >
                <TableCell>
                  <svg
                    viewBox={viewbox(row.path)}
                    style={{ margin: '6px 16px 4px 8px' }}
                    width={50}
                    height={50}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={row.path} fill="white" />
                  </svg>
                </TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{formatDate(row.creationDate)}</TableCell>
                <TableCell>{formatDate(row.changeDate)}</TableCell>
                <TableCell style={{ textAlign: 'center' }}>
                  {!beingRemoved ? (
                    <AppTooltip title="Delete" close>
                      <Fab
                        size="small"
                        color="primary"
                        aria-label="Delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          setBeingRemoved(row.name ?? undefined);
                        }}
                      >
                        <Icon>delete</Icon>
                      </Fab>
                    </AppTooltip>
                  ) : null}
                  {beingRemoved === row.name ? (
                    <>
                      <AppTooltip title="Cancel" close>
                        <Fab
                          size="small"
                          color="primary"
                          style={{ marginRight: 8 }}
                          aria-label="Cancel"
                          onClick={(event) => {
                            event.stopPropagation();
                            setBeingRemoved(undefined);
                          }}
                        >
                          <Icon>clear</Icon>
                        </Fab>
                      </AppTooltip>
                      <AppTooltip title="Confirm Deletion" close>
                        <Fab
                          size="small"
                          color="error"
                          aria-label="Confirm Deletion"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (row.name) {
                              onRemove(row.name);
                            }
                          }}
                        >
                          <Icon>check</Icon>
                        </Fab>
                      </AppTooltip>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <RaisedButton color="primary" onClick={() => onClose()}>
          Cancel
        </RaisedButton>
      </DialogActions>
    </Dialog>
  );
}

export function Open() {
  const store = useEditor();
  const [dialog, setDialog] = useState({ open: false, key: 0 });

  return (
    <>
      <AppTooltip title="Open" close>
        <Fab
          size="small"
          color="primary"
          style={{ transform: 'none', margin: '0 4px', marginLeft: 10 }}
          disabled={store.storage.isEmpty()}
          onClick={() => setDialog((state) => ({ open: true, key: state.key + 1 }))}
          aria-label="Open"
        >
          <Icon>folder_open</Icon>
        </Fab>
      </AppTooltip>
      <OpenDialog
        key={dialog.key}
        open={dialog.open}
        onClose={(name) => {
          setDialog((state) => ({ ...state, open: false }));
          if (name) {
            const storedPath = store.storage.getPath(name);
            if (storedPath && storedPath.name && storedPath.path) {
              store.openPath(storedPath.path, storedPath.name);
            }
          }
        }}
      />
    </>
  );
}
