import { ExtensionContext, languages, workspace } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { startLanguageClient } from './lsp';
import { PactLinterProvider } from './linter';
import {} from './lsp';
let client: LanguageClient;

export async function activate(context: ExtensionContext) {
  const linterProvider = new PactLinterProvider();
  linterProvider.activate(context.subscriptions);
  context.subscriptions.push(languages.registerHoverProvider('pact', linterProvider));
  if (workspace.getConfiguration().get('pact.enableLsp')) {
    client = await startLanguageClient(context);
  }
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
