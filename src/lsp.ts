import { ExtensionContext, commands, window, workspace } from 'vscode';
import { Executable, LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { execSync } from 'child_process';
import { join } from 'path';
import { log, logError } from './log';
import { version } from '../package.json';

function getPactupVersionPath(version: string) {
  const pwd = workspace.workspaceFolders?.[0].uri.fsPath;
  try {
    const pactPath = execSync(`npx -y pactup which ${version}`, { cwd: pwd });
    const pactExecutable = join(pactPath.toString().trim(), 'bin', 'pact');
    log.appendLine('Using Pact executable path: ' + pactExecutable);
    return pactExecutable;
  } catch (e) {
    logError(e);
  }
}
function installPact(version: string) {
  const pwd = workspace.workspaceFolders?.[0].uri.fsPath;
  const installed = getPactupVersionPath(version);
  if (installed) {
    return installed;
  }
  log.appendLine(pwd ? `Installing Pact ${version}` : 'Installing Pact ' + version);
  try {
    execSync(`npx -y pactup install ${version}`, { cwd: pwd });
  } catch (e) {
    logError(e);
  }
  return getPactupVersionPath(version);
}

function isPactVersion5(executable: string) {
  try {
    const buffer = execSync(`${executable} --version`);
    const version = buffer.toString().trim();
    if (version.includes('pact version 5')) {
      return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}

export function getPactExecutable() {
  const pactExecutable = workspace.getConfiguration().get<string>('pact.executable');
  const pactVersion = workspace.getConfiguration().get<string>('pact.version');

  if (pactExecutable && isPactVersion5(pactExecutable)) {
    log.appendLine('Using Pact executable path from settings: ' + pactExecutable);
    return pactExecutable;
  }

  if (isPactVersion5('pact')) {
    log.appendLine('Using Pact executable from PATH: pact');
    return 'pact';
  }

  if (pactVersion) {
    log.appendLine('Using Pact version from setting with pactup: ' + pactVersion);
    const executable = installPact(pactVersion);
    if (executable && isPactVersion5(executable)) {
      return executable;
    }
  }

  log.appendLine('Using a compatible Pact executable using pactup');
  const executable = installPact('nightly');
  if (executable && isPactVersion5(executable)) {
    return executable;
  }
}
export async function startLanguageClient(context: ExtensionContext) {
  log.appendLine(`⚪️ Pact for VS Code v${version}\n`);
  const command = getPactExecutable();
  if (!command) {
    window.showErrorMessage('Could not find or install compatible Pact executable');
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
