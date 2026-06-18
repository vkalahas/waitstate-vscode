import * as vscode from 'vscode';
import { resolvePublisherId, storePublisherId } from './publisherId';
import {
  isAllowedApiBaseUrl,
  isSafeExternalUrl,
  sanitizeStatusBarText,
} from './security';
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
  const publisherId = await resolvePublisherId(context);
  const apiBaseUrl =
    config.get<string>('apiBaseUrl') ||
    process.env.WAITSTATE_API_BASE_URL ||
    'http://127.0.0.1:8787';

  if (!publisherId) {
    console.log('Ad Engine Suspended: publisherId has not been configured.');
    return;
  }

  if (!isAllowedApiBaseUrl(apiBaseUrl)) {
    console.log(
      'Ad Engine Suspended: apiBaseUrl must use HTTPS (HTTP is only allowed for localhost).',
    );
    return;
  }

  const adStatusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  context.subscriptions.push(adStatusBarItem);

  fetchAndDisplayAd(publisherId, apiBaseUrl, adStatusBarItem);

  const setPublisherIdDisposable = vscode.commands.registerCommand(
    'waitstate.setPublisherId',
    async () => {
      const value = await vscode.window.showInputBox({
        prompt: 'Enter your Waitstate publisher ID',
        password: true,
        ignoreFocusOut: true,
      });
      if (!value?.trim()) {
        return;
      }
      await storePublisherId(context, value);
      vscode.window.showInformationMessage(
        'Waitstate publisher ID saved securely.',
      );
    },
  );
  context.subscriptions.push(setPublisherIdDisposable);

  const openAdDisposable = vscode.commands.registerCommand(
    'waitstate.openAd',
    async (
      url: string,
      pubId: string,
      campaignId: string,
      adId: string,
      baseUrl: string,
    ) => {
      if (!isSafeExternalUrl(url)) {
        console.debug('Blocked opening non-HTTPS sponsor URL.');
        return;
      }
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
    if (!isSafeExternalUrl(ad.url)) {
      console.debug('Skipped ad with non-HTTPS sponsor URL.');
      return;
    }

    const displayText = sanitizeStatusBarText(ad.text);
    if (!displayText) {
      return;
    }

    statusBar.text = `$(megaphone) ${displayText}`;
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
