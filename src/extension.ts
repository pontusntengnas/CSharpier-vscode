import { spawn } from "child_process";
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

      const formatResult = await formatCode(document.getText());
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
    },
  });
};

const formatCode = (code: string): Promise<string | Error | undefined> =>
  new Promise((resolve) => {
    const csharpierProcess = spawn(
      "dotnet",
      ["csharpier", "--fast", "--write-stdout"],
      {
        timeout: 2000,
      }
    );

    const output: Array<string> = [];

    csharpierProcess.stdout.on("data", (chunk: Buffer) => {
      output.push(chunk.toString());
    });

    csharpierProcess.on("error", resolve);

    csharpierProcess.on("exit", () => {
      if (output.length <= 0 && code.length > 0) {
        // HACK: if this is true then file could not compile.
        // Need to find a better way for this.
        resolve(undefined);
      }

      resolve(output.join());
    });

    csharpierProcess.stdin.write(code);
    csharpierProcess.stdin.end();
  });

const getDocumentRange = (document: TextDocument): Range => {
  var firstLine = document.lineAt(0);
  var lastLine = document.lineAt(document.lineCount - 1);
  return new Range(firstLine.range.start, lastLine.range.end);
};

const displayInstallNeededMessage = async () => {
  log("CSharpier not found");

  const selection = await window.showErrorMessage(
    "CSharpier must be installed globally.",
    "Install"
  );

  if (selection === "Install") {
    env.openExternal(Uri.parse("https://github.com/belav/csharpier"));
  }
};
