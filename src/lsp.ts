import { ExtensionContext, commands, window, workspace } from 'vscode';
import { Executable, LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { execSync } from 'child_process';
import { join } from 'path';
import { log, logError } from './log';
import { version } from '../package.json';

function installPact(version = 'development-latest') {
  const pwd = workspace.workspaceFolders?.[0].uri.fsPath;
  log.appendLine(pwd ? `Installing Pact in ${pwd}` : 'Installing Pact');
  try {
    execSync(`npx pactup install ${version}`, { cwd: pwd });
  } catch (e) {
    logError(e);
  }
  try {
    const pactPath = execSync(`npx pactup which ${version}`, { cwd: pwd });
    log.appendLine('Using Pact executable path: ' + pactPath.toString().trim());
    return join(pactPath.toString().trim(), 'bin', 'pact') as string;
  } catch (e) {
    logError(e);
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
  log.appendLine(`⚪️ Pact for VS Code v${version}\n`);
  const pactExecutable = workspace.getConfiguration().get<string>('pact.executable');
  const command = pactExecutable && isPactVersion5(pactExecutable) ? pactExecutable : installPact();
  if (!command) {
    log.appendLine('❌ Unable to find Pact executable.');
    window.showErrorMessage('Unable to find Pact executable.');
    return;
  }
  log.appendLine('🚀 Starting Pact LSP...');
  const run: Executable = {
    command,
    args: ['--lsp'],
    options: {
      env: process.env,
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
    outputChannel: log,
    traceOutputChannel: log,
  };

  const client = new LanguageClient('pactLanguageServer', 'Pact Language Server', serverOptions, clientOptions);
  // restart language server
  context.subscriptions.push(
    commands.registerCommand('pact.restartLanguageServer', async () => {
      log.appendLine('🔁 Restart Pact LSP...');
      await client.restart();
      log.appendLine('✅ Restarted Pact LSP.');
    }),
  );

  await client.start();
  return client;
}
