import { strictEqual } from "assert";
import { readFileSync, writeFileSync } from "fs";
import { commands, TextDocument, window, workspace } from "vscode";

interface FormatResult {
  formattedCode: string;
  originalCode: string;
}

suite("Formatting", () => {
  test("Formats physical C# file", async () => {
    const repoRootDir = process.env.REPO_ROOT_DIR;
    let originalCodeToRestore: string | null = null;

    try {
      const { formattedCode, originalCode } = await formatFile(
        `${repoRootDir}/src/test/suite/csharp-test-files/UnformattedTestFile.cs`
      );
      originalCodeToRestore = originalCode;

      const expected = readFileSync(
        `${repoRootDir}/src/test/suite/csharp-test-files/FormattedTestFile.cs`,
        "utf8"
      );

      strictEqual(formattedCode, expected);
    } finally {
      if (originalCodeToRestore) {
        writeFileSync(
          `${repoRootDir}/src/test/suite/csharp-test-files/UnformattedTestFile.cs`,
          originalCodeToRestore
        );
      }
    }
  });

  test("Formats virtual C# file", async () => {
    const document = await workspace.openTextDocument({
      content: `namespace CsharpierVscode.Tests
      {
          public class
           TestFileUnsaved
          {

          }
      }
      `,
      language: "csharp",
    });

    await showDocumentAndFormat(document);

    strictEqual(
      document.getText(),
      "namespace CsharpierVscode.Tests\n" +
        "{\n" +
        "    public class TestFileUnsaved\n" +
        "    {\n" +
        "    }\n" +
        "}\n"
    );
  });
});

const formatFile = async (fileName: string): Promise<FormatResult> => {
  const document = await workspace.openTextDocument(fileName);
  const originalCode = document.getText();

  await showDocumentAndFormat(document);

  return { formattedCode: document.getText(), originalCode };
};

const showDocumentAndFormat = async (document: TextDocument): Promise<void> => {
  await window.showTextDocument(document);

  await commands.executeCommand("editor.action.formatDocument");

  // Need a delay here for `document.getText()` to not return the old code.
  await delay();
};

const delay = (ms = 1000) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
