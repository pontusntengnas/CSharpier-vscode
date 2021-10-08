import { types } from "util";
import {
  env,
  ExtensionContext,
  languages,
  Range,
  TextDocument,
  TextEdit,
  Uri,
  window,
  workspace,
} from "vscode";
import {
  formatCodeWithCSharpier,
  formatFileWithCSharpierInPlace,
} from "./csharpier";
import { isInstalled } from "./is-installed";
import { log } from "./logger";

export async function activate(_: ExtensionContext) {
  if (!workspace.isTrusted) {
    workspace.onDidGrantWorkspaceTrust(() => initPlugin());
    return;
  }

  initPlugin();
}

const initPlugin = async () => {
  const formatterInstalled = await validateInstall();
  if (formatterInstalled) {
    registerFormatter();
  }
};

const validateInstall = async (): Promise<boolean> => {
  const installed = await isInstalled("dotnet-csharpier");
  if (!installed) {
    await displayInstallNeededMessage();
  }

  return installed;
};

const registerFormatter = (): void => {
  languages.registerDocumentFormattingEditProvider("csharp", {
    async provideDocumentFormattingEdits(
      document: TextDocument
    ): Promise<Array<TextEdit> | undefined> {
      log(`Formatting started.`);

      if (document.isUntitled) {
        return formatByTextEdit(document);
      }

      formatInPlace(document.fileName);
    },
  });
};

const formatInPlace = (fileName: string) => {
  const formatResult = formatFileWithCSharpierInPlace(fileName);

  if (!formatResult) {
    log(`No formatting done. [${fileName}] does probably not compile.`);
  }
};

const formatByTextEdit = async (
  document: TextDocument
): Promise<Array<TextEdit> | undefined> => {
  const formatResult = await formatCodeWithCSharpier(document.getText());

  if (types.isNativeError(formatResult)) {
    log(`An error occurred: ${formatResult.message}`);
    window.showErrorMessage(`An error occurred: ${formatResult.message}`);

    return undefined;
  }
  if (!formatResult) {
    log(
      `No formatting done. [${document.fileName}] does probably not compile.`
    );

    return undefined;
  }

  log(`Formatting completed.`);

  return [TextEdit.replace(getDocumentRange(document), formatResult)];
};

const getDocumentRange = (document: TextDocument): Range => {
  var firstLine = document.lineAt(0);
  var lastLine = document.lineAt(document.lineCount - 1);

  return new Range(firstLine.range.start, lastLine.range.end);
};

const displayInstallNeededMessage = async () => {
  log("CSharpier not found");

  const selection = await window.showErrorMessage(
    "CSharpier must be installed globally.",
    "Go to CSharpiers Github"
  );

  if (selection === "Go to CSharpiers Github") {
    env.openExternal(Uri.parse("https://github.com/belav/csharpier"));
  }
};
