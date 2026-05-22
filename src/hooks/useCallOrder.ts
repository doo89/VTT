import { useMemo } from 'react';
import { useVttStore } from '../store';
import type { Player, Marker } from '../types';

export interface CallOrderEntity {
  type: 'player' | 'marker';
  entity: Player | Marker;
  order: number;
  reason: string;
}

export interface OtherEntity {
  type: 'player' | 'marker';
  entity: Player | Marker;
}

export function useCallOrder(isNight: boolean, cycleMode: 'dayNight' | 'turns' | 'none') {
  const players = useVttStore(state => state.players);
  const markers = useVttStore(state => state.markers);
  const roles = useVttStore(state => state.roles);

  const { calledEntities, otherEntities } = useMemo(() => {
    const called: CallOrderEntity[] = [];
    const others: OtherEntity[] = [];

    players.forEach(player => {
      let isCalled = false;
      let minOrder = Infinity;
      let reason = '';

      player.tags.forEach(tag => {
        const order = (cycleMode === 'dayNight' && isNight) ? tag.callOrderNight : tag.callOrderDay;
        if (order !== null && order !== undefined && order !== '') {
          isCalled = true;
          const numOrder = Number(order);
          if (numOrder < minOrder) {
            minOrder = numOrder;
            reason = `Tag: ${tag.name}`;
          }
        }
      });

      const role = roles.find(r => r.id === player.roleId);
      if (role && role.tags) {
        role.tags.forEach(tag => {
            const order = (cycleMode === 'dayNight' && isNight) ? tag.callOrderNight : tag.callOrderDay;
            if (order !== null && order !== undefined && order !== '') {
              isCalled = true;
              const numOrder = Number(order);
              if (numOrder < minOrder) {
                minOrder = numOrder;
                reason = `Tag Rôle: ${tag.name}`;
              }
            }
        });
      }

      if (isCalled) {
        called.push({ type: 'player', entity: player, order: minOrder, reason });
      } else {
        others.push({ type: 'player', entity: player });
      }
    });

    markers.forEach(marker => {
      const order = (cycleMode === 'dayNight' && isNight) ? marker.tag.callOrderNight : marker.tag.callOrderDay;
      if (order !== null && order !== undefined && order !== '') {
        called.push({ type: 'marker', entity: marker, order: Number(order), reason: `Marker: ${marker.tag.name}` });
      } else {
        others.push({ type: 'marker', entity: marker });
      }
    });

    called.sort((a, b) => a.order - b.order);

    return { calledEntities: called, otherEntities: others };
  }, [players, markers, isNight, cycleMode, roles]);

  return { calledEntities, otherEntities };
}
