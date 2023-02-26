"use strict";

import { spawn } from "child_process";

import {
  CancellationToken,
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  Hover,
  MarkdownString,
  Position,
  Range,
  TextDocument,
  WorkspaceConfiguration,
  languages,
  workspace,
  Uri
} from "vscode";

import { normalize } from "path";

export class PactLinterProvider {
  private diagnosticCollection: DiagnosticCollection;
  private configuration: WorkspaceConfiguration;
  private document!: TextDocument;
  private hovers: Map<String,Map<Range,String>> = new Map();

  public constructor() {
    this.diagnosticCollection = languages.createDiagnosticCollection();
    this.configuration = workspace.getConfiguration("pact");

  }

  public activate(subscriptions: Disposable[]): void {
    workspace.onDidOpenTextDocument(this.lint, this, subscriptions);
    workspace.onDidSaveTextDocument(this.lint, this);
    workspace.onDidCloseTextDocument(
      (textDocument) => {
        this.diagnosticCollection.delete(textDocument.uri);
      },
      null,
      subscriptions
    );
  }

  public dispose(): void {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }

  private lint(textDocument: TextDocument) {
    if (textDocument.languageId !== "pact") {
      return;
    }
    this.hovers.clear();
    this.document = textDocument;
    const decodedChunks: Buffer[] = [];
    const cwd = this.getWorkspaceFolder();
    const proc = spawn(
      this.configuration.executable,
      [ "-r" ]
        .concat(this.configuration.enableTrace ? ["-t"] : [])
        .concat(this.configuration.enableCoverage ? ["-c"] : [])
        .concat(this.document.fileName),
      { cwd }
    );
    proc.stdout.on("data", (data: Buffer) => {
      console.log(`stdout: ${data}`);
      //decodedChunks.push(data);
    });

    proc.stderr.on("data", (data: Buffer) => {      
      decodedChunks.push(data);
    });

    proc.stdout.on("end", () => {
      this.getDiagnostics(decodedChunks.join(""));
    });
  }

  private getDiagnostics(output: string) {
    this.diagnosticCollection.clear();
    output.replace(/\n/g,";;;")
        .replace(/;;;\//g,":::/")
        .split(/:::/)
        .forEach((entry) => {
          this.createDiagnostic(entry.replace(/;;;/g,"\n"));
    });
  }

  private createDiagnostic(entry: string) {
    //console.log("entry: \n" + entry);
    const re = /^(?<file>[^:]*):(?<line>\d+):(?<col>\d+):(?:(?<sev>[^:]+):)?(?<msg>.*)/;
    const m = re.exec(entry);
    if (m !== null && m.groups !== null) { 
      const f = m?.groups?.file ?? "."; 
      const ln = Number(m?.groups?.line) - 1;
      const col = Number(m?.groups?.col);
      const sevs = m?.groups?.sev;
      let sev = DiagnosticSeverity.Error;
      if (sevs === "Trace") {
        sev = DiagnosticSeverity.Information;
      } else if (sevs === "Warning") {
        sev = DiagnosticSeverity.Warning;
      }
      const msg = m?.groups?.msg;
      const d = new Diagnostic(
        new Range(ln,col,ln,col+3),
        msg ?? "",
        sev
      );
      const uri = Uri.file(normalize(f));
      if (sev !== DiagnosticSeverity.Information) {
        const ds = this.diagnosticCollection.get(uri) ?? [];
        this.diagnosticCollection.set(uri,ds.concat([d]));
      } else {
        const hs = this.hovers.get(uri.toString()) ?? new Map();
        hs.set(new Range(ln,col,ln,col+3),msg ?? "");
        this.hovers.set(uri.toString(),hs);
        //console.log("add: " + uri + ", " + this.hovers.size);

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

  public provideHover
      ( doc: TextDocument, position: Position, token: CancellationToken) {
    const hs = this.hovers.get(doc.uri.toString()) ?? new Map();
    let ss:Array<String> = new Array();
    hs.forEach((s:string,r:Range) => {
      if (r.contains(position)) {
        ss.push(s);
      }
    });
    if (ss.length > 0) {
      return new Hover(new MarkdownString(ss.join("\n")));
    } else {
      return null;
    }
  }

}
