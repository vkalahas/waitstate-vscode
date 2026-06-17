export function sendImpressionBeacon(
  apiBaseUrl: string,
  publisherId: string,
  campaignId: string,
  adId: string,
) {
  fetch(`${apiBaseUrl}/impression`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publisherId,
      campaignId,
      adId,
      timestamp: Date.now(),
    }),
  }).catch((err: unknown) => {
    console.debug('Background tracking beacon dropped safely: ', err);
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
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      publisherId,
      campaignId,
      adId,
      timestamp: Date.now(),
    }),
  }).catch((err: unknown) => {
    console.debug('Background click beacon dropped safely: ', err);
  });
}
