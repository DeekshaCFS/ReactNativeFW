// src/offline/offlineStore.ts
//
// Java: FieldWeb/Database/DatabaseHandler -- the SQLite tables that hold task work done on
// a poor connection (acceptTask1_tbl, SummaryDetails_tbl, ...), each row flagged isSyncDone=0
// until it is posted from the Sync screen.
//
// Stored in SQLite (op-sqlite) on both platforms: one row per pending task, with its optional
// sections kept as JSON in a single column. Each save writes only that task's row, instead of
// rewriting the whole store. Existing data from the old JSON file is imported once, then the file
// is removed. Photos and documents are stored as base64 inside the record.
import { open, type DB } from '@op-engineering/op-sqlite';
import RNFS from 'react-native-fs';
import type { UpdateTaskStatus, TaskClosureResultData, AddPhotoBeforeTaskResultData } from '../api/task/task.types';
import type { UploadTaskDocDTO } from '../api/taskList/taskList.types';
import type { UpdateTaskWithEarnedAmountRequest } from '../api/passbook/passbook.types';
import type { SaveSelectedChkPointDataResultData } from '../api/fsrManagement/fsrManagement.types';

const DB_NAME = 'offline_pending.db';
const LEGACY_JSON_PATH = `${RNFS.DocumentDirectoryPath}/offline_pending_tasks.json`;

/** acceptTask1_tbl row: the UpdateTaskStatus body that was never posted. */
export type PendingAccept = Partial<UpdateTaskStatus> & {
  TaskId: number;
  UserId: number;
  TaskStatus: number;
  TaskState: number;
};

export type PendingTask = {
  taskId: number;
  newTaskId: string;
  userId: number;
  taskName?: string;
  createdAt: number;
  /** "0" = pending, mirrors Java's isSyncDone. */
  isSyncDone: '0';
  accept?: PendingAccept;
  /** acceptTask1_tbl rows after the accept (task started / ended), posted in order. */
  statuses?: PendingAccept[];
  /** BeforeAfterImg tables: before photos + note (AddPhotoBeforeTask body). */
  beforePhotos?: Partial<AddPhotoBeforeTaskResultData>;
  /** SelectedChkPoints table: FSR checkpoint answers picked on the closure screen. */
  checkpoints?: Partial<SaveSelectedChkPointDataResultData>[];
  /** SummaryDetails + child tables: the whole AddTaskClosureDetails body (tech notes, devices, after photos...). */
  closure?: TaskClosureResultData;
  /** RateModeTsk + Excess amount tables: the UpdateTaskWithEarnedAmount body. */
  payment?: UpdateTaskWithEarnedAmountRequest;
  /** DocumentUpload tables: the UploadTaskDoc body, files as base64. */
  documents?: Partial<UploadTaskDocDTO>;
};

export type PendingSection = 'accept' | 'statuses' | 'beforePhotos' | 'checkpoints' | 'closure' | 'payment' | 'documents';

type Sections = Partial<Pick<PendingTask, PendingSection>>;

// ---- database setup -------------------------------------------------------------------------

let dbReady: Promise<DB> | null = null;

const rowsOf = (result: any): any[] => result?.rows?._array ?? result?.rows ?? [];

const getDb = (): Promise<DB> => {
  if (!dbReady) {
    dbReady = (async () => {
      const db = open({ name: DB_NAME });
      await db.executeSync(
        `CREATE TABLE IF NOT EXISTS pending_tasks (
           task_id INTEGER PRIMARY KEY,
           new_task_id TEXT NOT NULL,
           user_id INTEGER NOT NULL,
           task_name TEXT,
           created_at INTEGER NOT NULL,
           sections TEXT NOT NULL DEFAULT '{}'
         )`,
      );
      await db.executeSync('CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_tasks (user_id)');
      await importLegacyJson(db);
      return db;
    })();
  }
  return dbReady;
};

// Writes and read-modify-write steps run one at a time, so two quick saves cannot interleave.
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(work: (db: DB) => Promise<T>): Promise<T> => {
  const run = queue.then(async () => work(await getDb()));
  queue = run.catch(() => undefined);
  return run;
};

/** One-time import of the old JSON file (written before the SQLite store), then remove it. */
const importLegacyJson = async (db: DB) => {
  try {
    if (!(await RNFS.exists(LEGACY_JSON_PATH))) return;
    const parsed = JSON.parse(await RNFS.readFile(LEGACY_JSON_PATH, 'utf8'));
    const tasks: PendingTask[] = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
    for (const task of tasks) {
      const { taskId, newTaskId, userId, taskName, createdAt, isSyncDone, ...sections } = task;
      await db.executeSync(
        `INSERT OR REPLACE INTO pending_tasks (task_id, new_task_id, user_id, task_name, created_at, sections)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [taskId, newTaskId, userId, taskName ?? null, createdAt ?? Date.now(), JSON.stringify(sections)],
      );
    }
    await RNFS.unlink(LEGACY_JSON_PATH);
  } catch {
    // Leave the file in place if the import fails, so nothing is lost; the next launch retries.
  }
};

// ---- row mapping ----------------------------------------------------------------------------

const toTask = (row: any): PendingTask => ({
  taskId: Number(row.task_id),
  newTaskId: String(row.new_task_id),
  userId: Number(row.user_id),
  taskName: row.task_name ?? undefined,
  createdAt: Number(row.created_at),
  isSyncDone: '0',
  ...(JSON.parse(row.sections || '{}') as Sections),
});

const readSections = (row: any): Sections => JSON.parse(row.sections || '{}');

// ---- change notifications -------------------------------------------------------------------

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

/** Subscribe to changes (Sync screen refresh). Returns the unsubscribe function. */
export const subscribeOffline = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

// ---- queries --------------------------------------------------------------------------------

export const getPendingTasks = async (userId?: number): Promise<PendingTask[]> =>
  serial(async db => {
    const result = userId == null
      ? await db.executeSync('SELECT * FROM pending_tasks ORDER BY created_at')
      : await db.executeSync('SELECT * FROM pending_tasks WHERE user_id = ? ORDER BY created_at', [userId]);
    return rowsOf(result).map(toTask);
  });

export const getPendingTask = async (taskId: number): Promise<PendingTask | undefined> =>
  serial(async db => {
    const rows = rowsOf(await db.executeSync('SELECT * FROM pending_tasks WHERE task_id = ?', [taskId]));
    return rows[0] ? toTask(rows[0]) : undefined;
  });

export const hasPendingData = async (userId?: number) => (await getPendingTasks(userId)).length > 0;

// ---- writes ---------------------------------------------------------------------------------

/** Insert or merge a section into the pending record of a task. */
export const savePendingTask = async (
  base: Pick<PendingTask, 'taskId' | 'newTaskId' | 'userId' | 'taskName'>,
  sections: Sections,
) => {
  await serial(async db => {
    const rows = rowsOf(await db.executeSync('SELECT * FROM pending_tasks WHERE task_id = ?', [base.taskId]));
    if (rows[0]) {
      const current = readSections(rows[0]);
      const { statuses, ...rest } = sections;
      const merged: Sections = { ...current, ...rest };
      if (statuses) merged.statuses = [...(current.statuses ?? []), ...statuses];
      await db.executeSync('UPDATE pending_tasks SET sections = ? WHERE task_id = ?', [
        JSON.stringify(merged),
        base.taskId,
      ]);
    } else {
      await db.executeSync(
        `INSERT INTO pending_tasks (task_id, new_task_id, user_id, task_name, created_at, sections)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [base.taskId, base.newTaskId, base.userId, base.taskName ?? null, Date.now(), JSON.stringify(sections)],
      );
    }
  });
  notify();
};

export const removePendingTask = async (taskId: number) => {
  await serial(async db => db.executeSync('DELETE FROM pending_tasks WHERE task_id = ?', [taskId]));
  notify();
};

/** Java: "Clear All Records" -> deleteNotSyncedRows on every offline table. */
export const clearPendingTasks = async (userId?: number) => {
  await serial(async db => {
    if (userId == null) {
      db.executeSync('DELETE FROM pending_tasks');
    } else {
      db.executeSync('DELETE FROM pending_tasks WHERE user_id = ?', [userId]);
    }
  });
  notify();
};

/** Drop one section after the server accepted it, so a retry after a later failure does not repost it. */
export const removePendingSection = async (taskId: number, section: PendingSection) => {
  await serial(async db => {
    const rows = rowsOf(await db.executeSync('SELECT * FROM pending_tasks WHERE task_id = ?', [taskId]));
    if (!rows[0]) return;
    const current = readSections(rows[0]);
    delete current[section];
    await db.executeSync('UPDATE pending_tasks SET sections = ? WHERE task_id = ?', [
      JSON.stringify(current),
      taskId,
    ]);
  });
};