/**
 * Types for Discord Notification
 */
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertItem {
  severity: AlertSeverity;
  message: string;
  rowId?: string;
  timestamp?: number;
}

/**
 * Sends an aggregated alert to Discord via Webhook.
 * @param alerts - List of alert items to send.
 */
export async function sendDiscordAlert(alerts: AlertItem[]) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL is not set. Skipping notification.');
    return;
  }

  if (alerts.length === 0) return;

  // Determine overall severity (highest one wins)
  const isCritical = alerts.some(a => a.severity === 'CRITICAL');
  const isWarning = alerts.some(a => a.severity === 'WARNING');
  
  let color = 0x3498db; // Blue (INFO)
  let title = 'ℹ️ Monitoring Info';

  if (isCritical) {
    color = 0xe74c3c; // Red (CRITICAL)
    title = '🚨 CRITICAL ALERT: Data Stale or System Failure';
  } else if (isWarning) {
    color = 0xf1c40f; // Yellow (WARNING)
    title = '⚠️ Warning: Potential Issues Detected';
  }

  // Format message body in Markdown
  const description = alerts.map(alert => {
    const icon = alert.severity === 'CRITICAL' ? '🔴' : alert.severity === 'WARNING' ? '🟡' : '🔵';
    const timeStr = alert.timestamp ? `<t:${Math.floor(alert.timestamp / 1000)}:R>` : '';
    const rowInfo = alert.rowId ? `(Row: ${alert.rowId})` : '';
    return `${icon} **[${alert.severity}]** ${alert.message} ${timeStr} ${rowInfo}`;
  }).join('\n');

  const payload = {
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Allcll Browser Monitoring',
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Failed to send Discord alert: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending Discord alert:', error);
  }
}
