import { window } from 'vscode';

export const log = window.createOutputChannel('PactLang');

export function logError(error: unknown): void {
  if (error instanceof Error) {
    log.appendLine(error.stack ?? error.message);
    return;
  }
  log.appendLine(error as string);
}
