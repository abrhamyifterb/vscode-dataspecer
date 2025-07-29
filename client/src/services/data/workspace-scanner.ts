import * as vscode from 'vscode';
import { debounce } from '../../utils/debounce';

export type WorkspaceScanCallback = (files: vscode.Uri[]) => void;

export class WorkspaceScanner {
  private watchers: vscode.FileSystemWatcher[];
  private debouncedScan: () => void;

  constructor(
    private patterns: string[],
    private callback: WorkspaceScanCallback,
    debounceMs = 500
  ) {
    this.debouncedScan = debounce(() => this.performScan(), debounceMs);

    this.watchers = this.patterns.map(pat =>
      vscode.workspace.createFileSystemWatcher(pat)
    );
  }

  public startWatching(): void {
    for (const w of this.watchers) {
      w.onDidCreate(() => this.debouncedScan());
      w.onDidChange(() => this.debouncedScan());
      w.onDidDelete(() => this.debouncedScan());
    }
  }

  public async performScan(): Promise<void> {
    const includeGlob = `{${this.patterns.join(',')}}`;

    console.debug(`[WorkspaceScanner] includeGlob = ${includeGlob}`);

    try {
      const files = await vscode.workspace.findFiles(includeGlob, '');
      console.debug(
        `[WorkspaceScanner] found ${files.length} files:`,
        files.map(u => u.fsPath)
      );
      this.callback(files);
    } catch (err) {
      console.error(`[WorkspaceScanner] scan error:`, err);
    }
  }

  public dispose(): void {
    for (const w of this.watchers) {
      w.dispose();
    }
  }
}
