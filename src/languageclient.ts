import { getPactInstallationInfo, installPact } from '@pact-toolbox/installer';
import { ExtensionContext, window, workspace } from 'vscode';
import { Executable, LanguageClient, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function startLanguageClient(_context: ExtensionContext) {
  const traceOutputChannel = window.createOutputChannel('Pact Language Server trace');
  // eslint-disable-next-line prefer-const
  let { versionInfo, isInstalled } = await getPactInstallationInfo({ nightly: true });
  if (!isInstalled) {
    traceOutputChannel.show();
    traceOutputChannel.appendLine(
      `Installing the latest version of Pact from the nightly channel. This may take a few minutes...`,
    );
    versionInfo = await installPact({
      nightly: true,
    });
    traceOutputChannel.appendLine(`Pact installed at ${versionInfo.pactExecutablePath}`);
    setTimeout(() => {
      traceOutputChannel.hide();
    }, 5000);
  }

  const run: Executable = {
    command: versionInfo.pactExecutablePath,
    args: ['--lsp'],
    options: {
      env: process.env,
    },
  };
  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: 'file', language: 'pact' }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
    traceOutputChannel,
  };

  const client = new LanguageClient('pactLanguageServer', 'Pact Language Server', serverOptions, clientOptions);
  // Start the client. This will also launch the server
  await client.start();
  return client;
}
