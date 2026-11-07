import {
  CarrierCode,
  ShippingLabel,
  TrackingEvent,
  TrackingEventType,
  generateLabelSchema,
  updateTrackingStatusSchema,
} from "../../shared/shippingCarrier";
import {
  generateTrackingNumber,
  getCarrierTrackingUrl,
} from "../services/shippingCarrierService";
import { z } from "zod";
import { readPersistentStoreSetting, writePersistentStoreSetting } from "../services/persistentStoreSetting";

const storeLabelsMap = new Map<number, ShippingLabel[]>();
const LABELS_KEY = "feature_shipping_labels";
const SENDER_KEY = "feature_shipping_sender";
async function getLabels(storeId: number) {
  const cached = storeLabelsMap.get(storeId);
  if (cached) return cached;
  const persisted = await readPersistentStoreSetting<ShippingLabel[]>(storeId, LABELS_KEY, []);
  storeLabelsMap.set(storeId, persisted);
  return persisted;
}
async function saveLabels(storeId: number, value: ShippingLabel[]) {
  storeLabelsMap.set(storeId, value);
  await writePersistentStoreSetting(storeId, LABELS_KEY, value, "Étiquettes d’expédition isolées par boutique");
}

export interface StoreSenderAddress {
  companyName: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

const defaultSenderAddresses = new Map<number, StoreSenderAddress>();

export async function getStoreSenderAddress(storeId: number): Promise<StoreSenderAddress> {
  const cached = defaultSenderAddresses.get(storeId);
  if (cached) return cached;
  const persisted = await readPersistentStoreSetting<StoreSenderAddress | null>(storeId, SENDER_KEY, null);
  const emptyAddress = persisted ?? { companyName: "", street: "", postalCode: "", city: "", country: "" };
  defaultSenderAddresses.set(storeId, emptyAddress);
  return emptyAddress;
}

export async function setStoreSenderAddress(
  storeId: number,
  address: StoreSenderAddress
): Promise<StoreSenderAddress> {
  defaultSenderAddresses.set(storeId, address);
  await writePersistentStoreSetting(storeId, SENDER_KEY, address, "Adresse expéditeur isolée par boutique");
  return address;
}

export async function createShippingLabelForOrder(
  storeId: number,
  input: z.infer<typeof generateLabelSchema>
): Promise<ShippingLabel> {
  const storeLabels = await getLabels(storeId);
  const senderAddress = await getStoreSenderAddress(storeId);

  const trackingNumber = generateTrackingNumber(input.carrier);
  const trackingUrl = getCarrierTrackingUrl(input.carrier, trackingNumber);

  const initialEvent: TrackingEvent = {
    status: "LABEL_CREATED",
    description: "Étiquette d'expédition générée par le commerçant.",
    location: `${senderAddress.city}, ${senderAddress.country}`,
    timestamp: new Date().toISOString(),
  };

  const label: ShippingLabel = {
    id: `LBL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    orderId: input.orderId,
    storeId,
    carrier: input.carrier,
    trackingNumber,
    trackingUrl,
    senderAddress,
    recipientAddress: {
      name: input.recipientName,
      street: input.recipientStreet,
      postalCode: input.recipientPostalCode,
      city: input.recipientCity,
      country: input.recipientCountry,
    },
    weightKg: input.weightKg,
    barcodeSvgOrText: trackingNumber,
    createdAt: new Date().toISOString(),
    events: [initialEvent],
  };

  storeLabels.unshift(label);
  await saveLabels(storeId, storeLabels);

  return label;
}

export async function getStoreShippingLabels(
  storeId: number
): Promise<ShippingLabel[]> {
  return await getLabels(storeId);
}

export async function getShippingLabelByTracking(
  trackingNumber: string
): Promise<ShippingLabel | null> {
  for (const labels of Array.from(storeLabelsMap.values())) {
    const found = labels.find(
      (l: ShippingLabel) => l.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
    );
    if (found) return found;
  }
  return null;
}

export async function getShippingLabelByOrder(
  storeId: number,
  orderId: string
): Promise<ShippingLabel | null> {
  const storeLabels = await getLabels(storeId);
  return storeLabels.find((l: ShippingLabel) => l.orderId === orderId) || null;
}

export async function updateLabelTrackingStatus(
  input: z.infer<typeof updateTrackingStatusSchema>
): Promise<ShippingLabel> {
  let targetLabel: ShippingLabel | null = null;
  let targetStoreId: number | null = null;

  for (const [sId, labels] of Array.from(storeLabelsMap.entries())) {
    const idx = labels.findIndex(
      (l: ShippingLabel) => l.trackingNumber.toLowerCase() === input.trackingNumber.toLowerCase()
    );
    if (idx !== -1) {
      targetLabel = labels[idx];
      targetStoreId = sId;
      break;
    }
  }

  if (!targetLabel || targetStoreId === null) {
    throw new Error("Étiquette / Numéro de suivi introuvable.");
  }

  const newEvent: TrackingEvent = {
    status: input.status,
    description: input.description,
    location: input.location,
    timestamp: new Date().toISOString(),
  };

  targetLabel.events.unshift(newEvent);

  const labels = storeLabelsMap.get(targetStoreId)!;
  const index = labels.findIndex((l) => l.id === targetLabel!.id);
  labels[index] = targetLabel;
  storeLabelsMap.set(targetStoreId, labels);

  return targetLabel;
}
