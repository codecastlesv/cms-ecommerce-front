export const UPLOAD_PROGRESS_THROTTLE_MS = 450;

export function createThrottledUploadProgressReporter(
  onPercent: (percent: number) => void,
  throttleMs: number = UPLOAD_PROGRESS_THROTTLE_MS,
) {
  let lastReportedPercent = -1;
  let lastReportTime = 0;

  const report = (loaded: number, total: number) => {
    if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) {
      return;
    }

    const percent = Math.min(100, Math.round((loaded * 100) / total));
    if (percent === lastReportedPercent) {
      return;
    }

    const now = Date.now();
    const isFirstReport = lastReportTime === 0;
    const throttleElapsed = now - lastReportTime >= throttleMs;
    const isComplete = percent >= 100;

    if (!isFirstReport && !throttleElapsed && !isComplete) {
      return;
    }

    lastReportedPercent = percent;
    lastReportTime = now;
    onPercent(percent);
  };

  const reset = () => {
    lastReportedPercent = -1;
    lastReportTime = 0;
  };

  return { report, reset };
}
