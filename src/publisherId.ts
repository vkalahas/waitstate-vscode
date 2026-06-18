import * as vscode from 'vscode';

const SECRET_KEY = 'waitstate.publisherId';

export async function resolvePublisherId(
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  const fromSecret = (await context.secrets.get(SECRET_KEY))?.trim();
  if (fromSecret) {
    return fromSecret;
  }

  const fromEnv = process.env.WAITSTATE_PUBLISHER_ID?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromSettings = vscode.workspace
    .getConfiguration('waitstate')
    .get<string>('publisherId')
    ?.trim();
  if (fromSettings) {
    await context.secrets.store(SECRET_KEY, fromSettings);
    return fromSettings;
  }

  return undefined;
}

export async function storePublisherId(
  context: vscode.ExtensionContext,
  publisherId: string,
): Promise<void> {
  await context.secrets.store(SECRET_KEY, publisherId.trim());
}
