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
  }).catch((err) => {
    console.debug('Background tracking beacon dropped safely: ', err);
  });
}
