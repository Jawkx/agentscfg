const MARKER_REGEX = /agentcfg:generated[^\n]*sha256=([a-f0-9]{64})/i;

export const extractMarkerSha = (content: string) => {
  const match = content.match(MARKER_REGEX);
  return match ? match[1] : null;
};
