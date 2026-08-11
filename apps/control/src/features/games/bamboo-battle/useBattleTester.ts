import { useEffect, useRef, useState } from 'react';
import { bridge } from '../../../bridge';
import type { BambooTeam, Notify, PatchConfig } from '../types';
import { battleBotNames } from './battleBots';

export function useBattleTester(patch: PatchConfig, notify: Notify) {
  const [testing, setTesting] = useState<BambooTeam>();
  const [botRunning, setBotRunning] = useState(false);
  const [botCount, setBotCount] = useState(24);
  const [botEvents, setBotEvents] = useState(0);
  const botTimer = useRef<number>();

  const activateBattle = async () => {
    await patch('stage', { gameMode: 'bamboo-battle' }, 'Đã kích hoạt Game 02 · Bamboo Battle.');
  };

  const stopBotBattle = () => {
    if (botTimer.current) window.clearInterval(botTimer.current);
    botTimer.current = undefined;
    setBotRunning(false);
  };

  useEffect(() => () => {
    if (botTimer.current) window.clearInterval(botTimer.current);
  }, []);

  const startBotBattle = async () => {
    stopBotBattle();
    const roster = battleBotNames.slice(0, botCount).map((name, index) => ({
      id: `battle-bot-${index + 1}`,
      name,
      level: 5 + index % 35,
      team: index % 2 === 0 ? 'green' as const : 'orange' as const,
    }));

    try {
      await activateBattle();
      await bridge.openStage();
      await bridge.gameAction('restart');
      await Promise.all(roster.map((bot) => bridge.fakeEvent({
        type: 'chat',
        viewer: bot,
        message: bot.team === 'green' ? '1' : '2',
      })));

      setBotEvents(roster.length);
      setBotRunning(true);
      botTimer.current = window.setInterval(() => {
        const bot = roster[Math.floor(Math.random() * roster.length)];
        if (!bot) return;
        void (async () => {
          if (Math.random() < 0.2) {
            const diamonds = [1, 5, 10, 20][Math.floor(Math.random() * 4)] ?? 1;
            await bridge.fakeEvent({
              type: 'gift',
              viewer: bot,
              giftName: diamonds >= 10 ? 'Tim pha lê' : 'Hoa hồng',
              giftCount: 1 + Math.floor(Math.random() * 3),
              diamonds,
            });
          } else {
            await bridge.fakeEvent({
              type: 'like',
              viewer: bot,
              likeCount: 10 + Math.floor(Math.random() * 111),
            });
          }
          setBotEvents((count) => count + 1);
        })().catch(() => stopBotBattle());
      }, 650);
      notify(`Đã thêm ${roster.length} người chơi giả vào Bamboo Battle.`);
    } catch (error) {
      stopBotBattle();
      notify(error instanceof Error ? error.message : 'Không thể bật người chơi giả.', 'error');
    }
  };

  const testBattle = async (team: BambooTeam) => {
    setTesting(team);
    const viewer = {
      id: `battle-test-${team}`,
      name: team === 'green' ? 'Chiến Binh Xanh' : 'Chiến Binh Cam',
      level: 12,
    };

    try {
      await activateBattle();
      await bridge.openStage();
      await bridge.fakeEvent({ type: 'chat', viewer, message: team === 'green' ? '1' : '2' });
      await bridge.fakeEvent({ type: 'like', viewer, likeCount: 120 });
      await bridge.fakeEvent({ type: 'gift', viewer, giftName: 'Hoa hồng thử nghiệm', giftCount: 3, diamonds: 10 });
      notify(`Đã thử đòn đánh cho phe ${team === 'green' ? 'Xanh' : 'Cam'}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể chạy thử Bamboo Battle.', 'error');
    } finally {
      setTesting(undefined);
    }
  };

  return {
    testing,
    botRunning,
    botCount,
    botEvents,
    setBotCount,
    stopBotBattle,
    startBotBattle,
    testBattle,
  };
}
