import * as vscode from 'vscode';
import { sendClickBeacon, sendImpressionBeacon } from './telemetry';

type AdResponse = {
  id: string;
  text: string;
  campaignId: string;
  url: string;
  brandName?: string;
  iconUrl?: string;
};

export async function activate(context: vscode.ExtensionContext) {
  if (process.env.DO_NOT_TRACK === '1') {
    return;
  }

  const config = vscode.workspace.getConfiguration('waitstate');
  const publisherId = config.get<string>('publisherId');
  const apiBaseUrl = config.get<string>('apiBaseUrl') ?? 'http://127.0.0.1:8787';

  if (!publisherId || publisherId.trim() === '') {
    console.log('Ad Engine Suspended: publisherId has not been configured.');
    return;
  }

  const adStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  context.subscriptions.push(adStatusBarItem);

  fetchAndDisplayAd(publisherId, apiBaseUrl, adStatusBarItem);

  const openAdDisposable = vscode.commands.registerCommand(
    'waitstate.openAd',
    async (
      url: string,
      pubId: string,
      campaignId: string,
      adId: string,
      baseUrl: string,
    ) => {
      sendClickBeacon(baseUrl, pubId, campaignId, adId);
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
  );
  context.subscriptions.push(openAdDisposable);
}

async function fetchAndDisplayAd(
  publisherId: string,
  apiBaseUrl: string,
  statusBar: vscode.StatusBarItem,
) {
  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 1500);

    const response = await fetch(`${apiBaseUrl}/fetch-ad`, {
      headers: {
        Authorization: `Bearer ${publisherId}`,
        Accept: 'application/json',
      },
      signal: abortController.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return;
    }

    const ad = (await response.json()) as AdResponse;

    statusBar.text = `$(megaphone) ${ad.text}`;
    statusBar.tooltip = `Click to view sponsor: ${ad.url}`;
    statusBar.command = {
      title: 'Open Ad URL',
      command: 'waitstate.openAd',
      arguments: [ad.url, publisherId, ad.campaignId, ad.id, apiBaseUrl],
    };
    statusBar.show();

    sendImpressionBeacon(apiBaseUrl, publisherId, ad.campaignId, ad.id);
  } catch {
    console.debug('Ad placement step skipped safely or timed out.');
  }
}

export function deactivate() {}
