import type { GiftEvent } from '@orbitstage/shared';

export type GiftEffectTier = 'standard' | 'premium' | 'super';

export interface GiftDefinition {
  id: string;
  name: string;
  imageAssetId?: string;
  animationAssetId?: string;
  tier: GiftEffectTier;
  defaultDiamondValue?: number;
}

export interface GiftPresentation {
  eventId: string;
  viewerId: string;
  viewerName: string;
  giftId: string;
  giftName: string;
  count: number;
  totalDiamonds: number;
  tier: GiftEffectTier;
  imageAssetId?: string;
  animationAssetId?: string;
  message?: string;
}

export class GiftCatalog {
  private readonly definitions = new Map<string, GiftDefinition>();

  public constructor(definitions: readonly GiftDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  public register(definition: GiftDefinition): void {
    if (!definition.id.trim() || !definition.name.trim()) throw new TypeError('Gift id and name are required');
    if (definition.defaultDiamondValue !== undefined && definition.defaultDiamondValue < 0) {
      throw new RangeError('Gift diamond value cannot be negative');
    }
    this.definitions.set(definition.id, structuredClone(definition));
  }

  public resolve(event: GiftEvent): GiftPresentation {
    const definition = this.definitions.get(event.payload.giftId);
    const unitDiamonds = event.payload.diamondValue || definition?.defaultDiamondValue || 0;
    const totalDiamonds = unitDiamonds * event.payload.repeatCount;
    const inferredTier: GiftEffectTier = totalDiamonds >= 1_000 ? 'super' : totalDiamonds >= 100 ? 'premium' : 'standard';
    return {
      eventId: event.id,
      viewerId: event.payload.viewer.id,
      viewerName: event.payload.viewer.displayName,
      giftId: event.payload.giftId,
      giftName: definition?.name ?? event.payload.giftName,
      count: event.payload.repeatCount,
      totalDiamonds,
      tier: definition?.tier ?? inferredTier,
      ...(definition?.imageAssetId ? { imageAssetId: definition.imageAssetId } : {}),
      ...(definition?.animationAssetId ? { animationAssetId: definition.animationAssetId } : {}),
      ...(event.payload.message ? { message: event.payload.message } : {}),
    };
  }

  public list(): readonly GiftDefinition[] {
    return [...this.definitions.values()].map((entry) => structuredClone(entry));
  }
}

export interface GiftWish {
  id: string;
  viewerId: string;
  viewerName: string;
  message: string;
  createdAt: string;
  visible: boolean;
}

export class GiftWishBoard {
  private readonly wishes = new Map<string, GiftWish>();

  public constructor(private readonly capacity = 1_000) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('Gift wish capacity must be positive');
  }

  public add(presentation: GiftPresentation, now = new Date()): GiftWish | undefined {
    const message = presentation.message?.trim();
    if (!message) return undefined;
    return this.addWish({
      id: presentation.eventId,
      viewerId: presentation.viewerId,
      viewerName: presentation.viewerName,
      message,
      createdAt: now.toISOString(),
      visible: true,
    });
  }

  public addWish(input: GiftWish): GiftWish {
    const id = input.id.trim();
    const viewerId = input.viewerId.trim();
    const viewerName = input.viewerName.trim();
    const message = input.message.trim();
    if (!id || id.length > 256 || !viewerId || viewerId.length > 128 || !viewerName || viewerName.length > 100) {
      throw new TypeError('Gift wish identity is invalid');
    }
    if (!message || message.length > 280 || !Number.isFinite(Date.parse(input.createdAt))) {
      throw new TypeError('Gift wish content or timestamp is invalid');
    }
    const wish: GiftWish = {
      id,
      viewerId,
      viewerName,
      message,
      createdAt: new Date(input.createdAt).toISOString(),
      visible: input.visible,
    };
    this.wishes.set(wish.id, wish);
    while (this.wishes.size > this.capacity) {
      const oldest = [...this.wishes.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
      if (!oldest) break;
      this.wishes.delete(oldest.id);
    }
    return structuredClone(wish);
  }

  public get(id: string): GiftWish | undefined {
    const wish = this.wishes.get(id);
    return wish ? structuredClone(wish) : undefined;
  }

  public setVisible(id: string, visible: boolean): boolean {
    const wish = this.wishes.get(id);
    if (!wish) return false;
    wish.visible = visible;
    return true;
  }

  public remove(id: string): boolean {
    return this.wishes.delete(id);
  }

  public list(includeHidden = false): readonly GiftWish[] {
    return [...this.wishes.values()]
      .filter((wish) => includeHidden || wish.visible)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((wish) => structuredClone(wish));
  }
}
