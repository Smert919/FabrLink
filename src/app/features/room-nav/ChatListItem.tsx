import React from 'react';
import { Room } from 'matrix-js-sdk';
import { Avatar, Box, Text } from 'folds';
import { NavLink } from '../../components/nav';
import { RoomAvatar } from '../../components/room-avatar';
import { UnreadBadge } from '../../components/unread-badge';
import { getDirectRoomAvatarUrl, getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomUnread } from '../../state/hooks/unread';
import { roomToUnreadAtom } from '../../state/room/roomToUnread';
import { useRoomTypingMember } from '../../hooks/useRoomTypingMembers';
import { useRoomLatestRenderedEvent } from '../../hooks/useRoomLatestRenderedEvent';
import { useRoomName } from '../../hooks/useRoomMeta';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { MessageEvent, StateEvent } from '../../../types/matrix/room';

const pad = (n: number) => n.toString().padStart(2, '0');

const formatTime = (ts?: number): string => {
  if (!ts) return '';
  const date = new Date(ts);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
};

type RoomPreview = {
  text: string;
  time: string;
  isMine: boolean;
};

function getPreview(room: Room, myUserId: string | null): RoomPreview {
  const events = room.getLiveTimeline().getEvents();
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const evt = events[i];
    if (!evt) continue;
    const type = evt.getType();
    const content = evt.getContent() as Record<string, unknown>;
    const isMine = evt.getSender() === myUserId;
    const senderName = room.getMember(evt.getSender() ?? '')?.rawDisplayName ?? '';

    if (type === MessageEvent.RoomMessage || type === MessageEvent.RoomMessageEncrypted) {
      const msgtype = content.msgtype as string | undefined;
      let body = typeof content.body === 'string' ? content.body : '';
      if (msgtype === 'm.image') body = 'Фото';
      else if (msgtype === 'm.video') body = 'Видео';
      else if (msgtype === 'm.audio') body = 'Голосовое сообщение';
      else if (msgtype === 'm.file') body = 'Файл';
      if (!body) continue;
      return {
        text: isMine || !senderName ? body : `${senderName}: ${body}`,
        time: formatTime(evt.getTs() ?? undefined),
        isMine,
      };
    }
    if (type === MessageEvent.Sticker) {
      return {
        text: isMine ? 'Стикер' : `${senderName}: Стикер`,
        time: formatTime(evt.getTs() ?? undefined),
        isMine,
      };
    }
    if (type === StateEvent.RoomName) {
      return {
        text: isMine ? 'Вы изменили название' : `${senderName} изменил(а) название`,
        time: formatTime(evt.getTs() ?? undefined),
        isMine,
      };
    }
  }
  return { text: 'Нет сообщений', time: '', isMine: false };
}

type ChatListItemProps = {
  room: Room;
  selected: boolean;
  linkPath: string;
  direct?: boolean;
};

export function ChatListItem({ room, selected, linkPath, direct }: ChatListItemProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const roomName = useRoomName(room);
  const unread = useRoomUnread(room.roomId, roomToUnreadAtom);
  const typing = useRoomTypingMember(room.roomId).filter(
    (receipt) => receipt.userId !== mx.getUserId()
  );
  const latestEvent = useRoomLatestRenderedEvent(room);
  const preview = getPreview(room, mx.getUserId());

  const avatarSrc = direct
    ? getDirectRoomAvatarUrl(mx, room, 96, useAuthentication)
    : getRoomAvatarUrl(mx, room, 96, useAuthentication);

  const previewText = typing.length > 0 ? 'печатает…' : preview.text;

  return (
    <NavLink to={linkPath}>
      <Box
        alignItems="Center"
        gap="300"
        style={{
          width: '100%',
          minWidth: 0,
          padding: '8px 10px',
          borderRadius: 10,
          backgroundColor: selected ? 'var(--tg-selected, rgba(51,144,236,0.16))' : undefined,
        }}
        data-tg-room={room.roomId}
        data-tg-event={latestEvent?.getId()}
      >
        <Avatar size="400" radii="Pill">
          <RoomAvatar
            roomId={room.roomId}
            src={avatarSrc}
            alt={roomName}
            renderFallback={() => (
              <Text as="span" size="H6">
                {nameInitials(roomName)}
              </Text>
            )}
          />
        </Avatar>
        <Box grow="Yes" direction="Column" style={{ minWidth: 0, gap: 2 }}>
          <Box alignItems="Center" gap="200" style={{ minWidth: 0 }}>
            <Box grow="Yes" style={{ minWidth: 0 }}>
              <Text as="span" size="T300" priority={unread ? '500' : '300'} truncate>
                {roomName}
              </Text>
            </Box>
            <Text as="span" size="T200" priority="300" style={{ flexShrink: 0 }}>
              {preview.time}
            </Text>
          </Box>
          <Box alignItems="Center" gap="200" style={{ minWidth: 0 }}>
            <Box grow="Yes" style={{ minWidth: 0 }}>
              <Text
                as="span"
                size="T200"
                priority={unread ? '400' : '300'}
                truncate
                style={{ opacity: typing.length > 0 ? 0.9 : 0.7 }}
              >
                {previewText}
              </Text>
            </Box>
            {unread && (
              <UnreadBadge highlight={unread.highlight > 0} count={unread.total} />
            )}
          </Box>
        </Box>
      </Box>
    </NavLink>
  );
}
