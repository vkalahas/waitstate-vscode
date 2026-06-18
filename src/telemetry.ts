import { toSafeErrorMessage } from './security';

function beaconHeaders(publisherId: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${publisherId}`,
  };
}

function beaconBody(
  publisherId: string,
  campaignId: string,
  adId: string,
): string {
  return JSON.stringify({
    publisherId,
    campaignId,
    adId,
    timestamp: Date.now(),
  });
}

export function sendImpressionBeacon(
  apiBaseUrl: string,
  publisherId: string,
  campaignId: string,
  adId: string,
) {
  fetch(`${apiBaseUrl}/impression`, {
    method: 'POST',
    headers: beaconHeaders(publisherId),
    body: beaconBody(publisherId, campaignId, adId),
  }).catch((err: unknown) => {
    console.debug(
      'Background impression beacon dropped safely:',
      toSafeErrorMessage(err),
    );
  });
}

export function sendClickBeacon(
  apiBaseUrl: string,
  publisherId: string,
  campaignId: string,
  adId: string,
) {
  fetch(`${apiBaseUrl}/click`, {
    method: 'POST',
    headers: beaconHeaders(publisherId),
    body: beaconBody(publisherId, campaignId, adId),
  }).catch((err: unknown) => {
    console.debug(
      'Background click beacon dropped safely:',
      toSafeErrorMessage(err),
    );
  });
}
