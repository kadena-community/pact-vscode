import { spawn } from 'child_process';

import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  Hover,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  Uri,
  WorkspaceConfiguration,
  commands,
  languages,
  workspace,
} from 'vscode';

import { normalize } from 'path';

export class PactLinterProvider {
  private diagnosticCollection: DiagnosticCollection;
  private configuration: WorkspaceConfiguration;
  private document!: TextDocument;
  private hovers: Map<string, Map<Range, string>> = new Map();

  public constructor() {
    this.diagnosticCollection = languages.createDiagnosticCollection();
    this.configuration = workspace.getConfiguration('pact');
  }

  public activate(subscriptions: Disposable[]): void {
    workspace.onDidChangeConfiguration(this.handleConfigurationChange, this);
    workspace.onDidOpenTextDocument(this.lint, this, subscriptions);
    workspace.onDidSaveTextDocument(this.lint, this);
    workspace.onDidCloseTextDocument(
      (textDocument) => {
        this.diagnosticCollection.delete(textDocument.uri);
      },
      null,
      subscriptions,
    );
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }

  private handleConfigurationChange() {
    if (!workspace.getConfiguration('pact').enableCoverage) {
      const configuration = workspace.getConfiguration('coverage-gutters');
      configuration.update('showLineCoverage', false);
      configuration.update('showRulerCoverage', false);
      configuration.update('showGutterCoverage', false);
    }
  }

  private lint(textDocument: TextDocument) {
    if (textDocument.languageId !== 'pact') {
      return;
    }
    this.hovers.clear();
    this.document = textDocument;
    const decodedChunks: Buffer[] = [];
    const cwd = this.getWorkspaceFolder();
    const proc = spawn(
      this.configuration.executable,
      ['-r']
        .concat(this.configuration.enableTrace ? ['-t'] : [])
        .concat(this.configuration.enableCoverage ? ['-c'] : [])
        .concat(this.document.fileName),
      { cwd },
    );
    proc.stdout.on('data', (data: Buffer) => {
      console.log(`stdout: ${data}`);
    });

    proc.stderr.on('data', (data: Buffer) => {
      decodedChunks.push(data);
    });

    proc.stdout.on('end', () => {
      this.getDiagnostics(decodedChunks.join(''));
      this.generateCoverageReport();
    });
  }

  private getDiagnostics(output: string) {
    this.diagnosticCollection.clear();
    output
      .replace(/\n/g, ';;;')
      .replace(/;;;\//g, ':::/')
      .split(/:::/)
      .forEach((entry) => {
        this.createDiagnostic(entry.replace(/;;;/g, '\n'));
      });
  }

  private createDiagnostic(entry: string) {
    const re = /^(?<file>[^:]*):(?<line>\d+):(?<col>\d+):(?:(?<sev>[^:]+):)?(?<msg>.*)/;
    const m = re.exec(entry);
    if (m !== null && m.groups !== null) {
      const f = m?.groups?.file ?? '.';
      const ln = Number(m?.groups?.line) - 1;
      const col = Number(m?.groups?.col);
      const sevs = m?.groups?.sev;
      let sev = DiagnosticSeverity.Error;
      if (sevs === 'Trace') {
        sev = DiagnosticSeverity.Information;
      } else if (sevs === 'Warning') {
        sev = DiagnosticSeverity.Warning;
      }
      const msg = m?.groups?.msg;
      const d = new Diagnostic(new Range(ln, col, ln, col + 3), msg ?? '', sev);
      const uri = Uri.file(normalize(f));
      if (sev !== DiagnosticSeverity.Information) {
        const ds = this.diagnosticCollection.get(uri) ?? [];
        this.diagnosticCollection.set(uri, ds.concat([d]));
      } else {
        const hs = this.hovers.get(uri.toString()) ?? new Map();
        hs.set(new Range(ln, col, ln, col + 3), msg ?? '');
        this.hovers.set(uri.toString(), hs);
      }
    }
  }

  private getWorkspaceFolder(): string | undefined {
    if (workspace.workspaceFolders) {
      if (this.document) {
        const workspaceFolder = workspace.getWorkspaceFolder(this.document.uri);
        if (workspaceFolder) {
          return workspaceFolder.uri.fsPath;
        }
      }
      return workspace.workspaceFolders[0].uri.fsPath;
    } else {
      return undefined;
    }
  }

  private generateCoverageReport(): void {
    if (!this.configuration.enableCoverage) {
      return;
    }

    const directory = this.document.fileName.split('/').slice(0, -1).join('/');

    const configuration = workspace.getConfiguration('coverage-gutters');
    configuration.update('showLineCoverage', true);
    configuration.update('showRulerCoverage', true);
    configuration.update('showGutterCoverage', true);
    configuration.update('coverageReportFileName', `${directory}/coverage/html/index.html`);
    commands.executeCommand('coverage-gutters.displayCoverage');

    spawn(
      'npm',
      ['run', 'coverage:html', '--', '-o', `${directory}/coverage/html`, `${directory}/coverage/lcov.info`],
      { cwd: this.getWorkspaceFolder() },
    );
  }

  public provideHover(doc: TextDocument, position: Position) {
    const hs = this.hovers.get(doc.uri.toString()) ?? new Map();
    const ss: string[] = [];
    hs.forEach((s: string, r: Range) => {
      if (r.contains(position)) {
        ss.push(s);
      }
    });
    if (ss.length > 0) {
      return new Hover(new MarkdownString(ss.join('\n')));
    } else {
      return null;
    }
  }
}
