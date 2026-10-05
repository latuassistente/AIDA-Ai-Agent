export type Channel =
  | "EMAIL"
  | "WHATSAPP"
  | "SMS"
  | "TELEGRAM"
  | "MESSENGER"
  | "INSTAGRAM"
  | "TIKTOK"
  | "VOICE";

export interface UnifiedMessage {
  id: string;
  tenantId: string;
  customerId?: string;
  projectId?: string;
  channel: Channel;
  direction: "INBOUND" | "OUTBOUND";
  externalId?: string;
  sender: string;
  recipient: string;
  text?: string;
  receivedAt: string;
}

export interface ChannelAdapter {
  readonly channel: Channel;
  receive(): Promise<UnifiedMessage[]>;
  send(message: UnifiedMessage): Promise<{ externalId: string }>;
}
