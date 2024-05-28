import { ExtensionContext, commands, window, workspace } from 'vscode';
import { Executable, LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const traceOutputChannel = window.createOutputChannel('Pact Language Server Trace');
const pwd = workspace.workspaceFolders?.[0].uri.fsPath;

function installPact(version = 'development-latest') {
  traceOutputChannel.show();
  traceOutputChannel.appendLine(pwd ? `Installing Pact in ${pwd}` : 'Installing Pact');
  try {
    execSync(`npx pactup install ${version}`, { cwd: pwd });
  } catch (e) {
    traceOutputChannel.appendLine((e as Error).toString());
    window.showErrorMessage('Failed to install Pact');
    throw e;
  }
  try {
    const pactPath = execSync(`npx pactup which ${version}`, { cwd: pwd });
    traceOutputChannel.appendLine('Using Pact executable path: ' + pactPath.toString().trim());
    return join(pactPath.toString().trim(), 'bin', 'pact') as string;
  } catch (e) {
    traceOutputChannel.appendLine((e as Error).toString());
    window.showErrorMessage('Failed to get Pact executable path');
    throw e;
  }
}

function isPactVersion5(executable: string) {
  try {
    const buffer = execSync(`${executable} --version`);
    const version = buffer.toString().trim();
    if (version.includes('pact version 5')) {
      return true;
    }
  } catch (e) {
    return false;
  }
}

export async function startLanguageClient(context: ExtensionContext) {
  const pactExecutable = workspace.getConfiguration().get<string>('pact.executable');
  const command = pactExecutable && isPactVersion5(pactExecutable) ? pactExecutable : installPact();
  traceOutputChannel.appendLine('Starting Pact Language Server');
  const run: Executable = {
    command,
    args: ['--lsp'],
    options: {
      env: process.env,
      cwd: pwd,
    },
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'pact' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
    traceOutputChannel,
  };

  const client = new LanguageClient('pactLanguageServer', 'Pact Language Server', serverOptions, clientOptions);
  // restart language server
  context.subscriptions.push(
    commands.registerCommand('pact.restartLanguageServer', async () => {
      await client.restart();
      window.showInformationMessage('Pact language server restarted');
    }),
  );

  await client.start();
  return client;
}
