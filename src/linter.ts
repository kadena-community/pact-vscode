"use strict";

import { spawn } from "child_process";

import {
  Diagnostic,
  DiagnosticCollection,
  DiagnosticSeverity,
  Disposable,
  Range,
  TextDocument,
  WorkspaceConfiguration,
  languages,
  workspace,
  Uri
} from "vscode";

export class PactLinterProvider {
  private diagnosticCollection: DiagnosticCollection;
  private configuration: WorkspaceConfiguration;
  private document!: TextDocument;

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
    this.document = textDocument;
    const decodedChunks: Buffer[] = [];
    const cwd = this.getWorkspaceFolder();
    const proc = spawn(
      this.configuration.executable,
      [
        "-r",
        "-t",
        this.document.fileName
      ],
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
    console.log("entry: \n" + entry);
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
      const uri = Uri.file(f);
      const ds = this.diagnosticCollection.get(uri) ?? [];
      this.diagnosticCollection.set(uri,ds.concat([d]));
    }

      //
    // const tokens = violation.replace("~||~", "").split("~|~");

    // return new Diagnostic(
    //   this.getRange(tokens),
    //   this.getMessage(tokens),
    //   this.getSeverity(tokens)
    // );
    // return new Diagnostic(
    //   new Range(0,1,0,3),
    //   "Ruh Roh: " + entry,
    //   DiagnosticSeverity.Error
    // );
  }

  private getRange(tokens: string[]) {
    return new Range(
      Number(tokens[1]) - 1,
      Number(tokens[2]) - 1,
      Number(tokens[1]) - 1,
      Number.MAX_VALUE
    );
  }

  private getMessage(tokens: string[]) {
    return (
      "Lint: " +
      this.getSeverityAsText(tokens[0]).toUpperCase() +
      ": " +
      tokens[3]
    );
  }

  private getSeverityAsText(severity: string) {
    switch (parseInt(severity, 10)) {
      case 5:
        return "gentle";
      case 4:
        return "stern";
      case 3:
        return "harsh";
      case 2:
        return "cruel";
      default:
        return "brutal";
    }
  }

  private getSeverity(tokens: string[]) {
    switch (this.configuration[this.getSeverityAsText(tokens[0])]) {
      case "hint":
        return DiagnosticSeverity.Hint;
      case "info":
        return DiagnosticSeverity.Information;
      case "warning":
        return DiagnosticSeverity.Warning;
      default:
        return DiagnosticSeverity.Error;
    }
  }

  private isValidViolation(violation: string) {
    return true;
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

  private getCommandArguments(): string[] {
    return [
      "--verbose",
      "%s~|~%l~|~%c~|~%m~|~%e~|~%p~||~%n",
      this.document.fileName,
    ];
  }
}
