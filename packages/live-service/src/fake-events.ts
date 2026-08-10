import {
  createLiveEvent,
  type CreateLiveEventOptions,
  type LiveEvent,
  type LiveEventPayloadMap,
  type LiveEventType,
  type Viewer,
} from '@orbitstage/shared';

export interface FakeEventOverrides {
  viewer?: Partial<Viewer>;
  message?: string;
  likeCount?: number;
  giftId?: string;
  giftName?: string;
  repeatCount?: number;
  diamondValue?: number;
}

const NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Lan', 'Minh', 'Ngọc'];
const MESSAGES = ['Xin chào sân khấu!', 'Nhạc hay quá!', 'Chúc LIVE thật vui!', 'OrbitStage đẹp quá!'];

export class FakeEventGenerator {
  private sequence = 0;

  public constructor(private readonly random: () => number = Math.random) {}

  public next<TType extends Exclude<LiveEventType, 'connection' | 'disconnect' | 'reconnect'>>(
    type: TType,
    overrides: FakeEventOverrides = {},
    options: CreateLiveEventOptions = {},
  ): Extract<LiveEvent, { type: TType }> {
    this.sequence += 1;
    const viewer: Viewer = {
      id: overrides.viewer?.id ?? `fake-viewer-${this.sequence}`,
      displayName: overrides.viewer?.displayName ?? this.pick(NAMES),
      isModerator: overrides.viewer?.isModerator ?? false,
      isSubscriber: overrides.viewer?.isSubscriber ?? false,
      ...(overrides.viewer?.uniqueId ? { uniqueId: overrides.viewer.uniqueId } : {}),
      ...(overrides.viewer?.avatarUrl ? { avatarUrl: overrides.viewer.avatarUrl } : {}),
    };

    let payload: LiveEventPayloadMap[TType];
    switch (type) {
      case 'chat':
        payload = { viewer, message: overrides.message ?? this.pick(MESSAGES) } as LiveEventPayloadMap[TType];
        break;
      case 'like':
        payload = { viewer, count: overrides.likeCount ?? 10 } as LiveEventPayloadMap[TType];
        break;
      case 'gift':
        payload = {
          viewer,
          giftId: overrides.giftId ?? 'fake-rose',
          giftName: overrides.giftName ?? 'Hoa hồng thử nghiệm',
          repeatCount: overrides.repeatCount ?? 1,
          diamondValue: overrides.diamondValue ?? 1,
          repeatEnd: true,
        } as LiveEventPayloadMap[TType];
        break;
      default:
        payload = { viewer } as LiveEventPayloadMap[TType];
    }
    return createLiveEvent(type, payload, 'fake', options);
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.min(items.length - 1, Math.floor(this.random() * items.length))] as T;
  }
}

export const createFakeEvent = <TType extends Exclude<LiveEventType, 'connection' | 'disconnect' | 'reconnect'>>(
  type: TType,
  overrides?: FakeEventOverrides,
): Extract<LiveEvent, { type: TType }> => new FakeEventGenerator().next(type, overrides);
