
import { ExtensionContext, languages, workspace } from "vscode";
import { PactLinterProvider } from "./linter";
import { PactLanguageClient } from "./languageclient";

let client: PactLanguageClient;

export async function activate(context: ExtensionContext) {
    const linterProvider = new PactLinterProvider();
    linterProvider.activate(context.subscriptions);
    const d = languages.registerHoverProvider("pact",linterProvider);
    context.subscriptions.push(d);
    if(workspace.getConfiguration().get('pact.enableLsp')!){
        client = new PactLanguageClient(); 
    };
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}