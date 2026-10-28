import React, { MouseEventHandler, forwardRef, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  PopOut,
  RectCords,
  Text,
  config,
  toRem,
} from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtomValue } from 'jotai';
import FocusTrap from 'focus-trap-react';
import { factoryRoomIdByActivity } from '../../../utils/sort';
import { NavEmptyCenter, NavEmptyLayout } from '../../../components/nav';
import {
  getDirectCreatePath,
  getExplorePath,
  getHomeCreatePath,
  getHomeRoomPath,
  getHomeSearchPath,
  getInboxPath,
} from '../../pathUtils';
import { getCanonicalAliasOrRoomId } from '../../../utils/matrix';
import { useSelectedRoom } from '../../../hooks/router/useSelectedRoom';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { VirtualTile } from '../../../components/virtualizer';
import { ChatListItem } from '../../../features/room-nav';
import { PageNav, PageNavHeader, PageNavContent } from '../../../components/page';
import { stopPropagation } from '../../../utils/keyboard';
import { allRoomsAtom } from '../../../state/room-list/roomList';
import { useRooms } from '../../../state/hooks/roomList';
import { mDirectAtom } from '../../../state/mDirectList';
import { Settings } from '../../../features/settings';
import { Modal500 } from '../../../components/Modal500';
import { UserAvatar } from '../../../components/user-avatar';
import { useUserProfile } from '../../../hooks/useUserProfile';
import { useMediaAuthentication } from '../../../hooks/useMediaAuthentication';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../../utils/matrix';
import { nameInitials } from '../../../utils/common';

type HeaderMenuProps = {
  requestClose: () => void;
  openSettings: () => void;
};

const HeaderMenu = forwardRef<HTMLDivElement, HeaderMenuProps>(
  ({ requestClose, openSettings }, ref) => {
    const navigate = useNavigate();

    const go = (path: string) => {
      requestClose();
      navigate(path);
    };

    return (
      <Menu ref={ref} style={{ maxWidth: toRem(220), width: '100vw' }}>
        <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
          <MenuItem
            onClick={() => go(getDirectCreatePath())}
            size="300"
            radii="300"
            after={<Icon size="100" src={Icons.Message} />}
          >
            <Text as="span" size="T300" style={{ flexGrow: 1 }} truncate>
              Новый чат
            </Text>
          </MenuItem>
          <MenuItem
            onClick={() => go(getHomeCreatePath())}
            size="300"
            radii="300"
            after={<Icon size="100" src={Icons.UserPlus} />}
          >
            <Text as="span" size="T300" style={{ flexGrow: 1 }} truncate>
              Новая группа
            </Text>
          </MenuItem>
          <MenuItem
            onClick={() => go(getExplorePath())}
            size="300"
            radii="300"
            after={<Icon size="100" src={Icons.Search} />}
          >
            <Text as="span" size="T300" style={{ flexGrow: 1 }} truncate>
              Обзор
            </Text>
          </MenuItem>
          <MenuItem
            onClick={() => go(getInboxPath())}
            size="300"
            radii="300"
            after={<Icon size="100" src={Icons.Inbox} />}
          >
            <Text as="span" size="T300" style={{ flexGrow: 1 }} truncate>
              Входящие
            </Text>
          </MenuItem>
        </Box>
        <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
          <MenuItem
            onClick={() => {
              requestClose();
              openSettings();
            }}
            size="300"
            radii="300"
            after={<Icon size="100" src={Icons.Setting} />}
          >
            <Text as="span" size="T300" style={{ flexGrow: 1 }} truncate>
              Настройки
            </Text>
          </MenuItem>
        </Box>
      </Menu>
    );
  }
);

function HomeHeader({ openSettings }: { openSettings: () => void }) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const userId = mx.getUserId()!;
  const profile = useUserProfile(userId);
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const displayName = profile.displayName ?? getMxIdLocalPart(userId) ?? userId;
  const avatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 96, 96, 'crop') ?? undefined
    : undefined;

  const handleOpenMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };

  return (
    <>
      <PageNavHeader outlined={false}>
        <Box alignItems="Center" grow="Yes" gap="200">
          <Box shrink="No">
            <button
              type="button"
              onClick={openSettings}
              style={{
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
              }}
              aria-label="Профиль"
            >
              <Avatar size="400" radii="Pill">
                <UserAvatar
                  userId={userId}
                  src={avatarUrl}
                  renderFallback={() => (
                    <Text as="span" size="H6">
                      {nameInitials(displayName)}
                    </Text>
                  )}
                />
              </Avatar>
            </button>
          </Box>
          <Box grow="Yes" style={{ minWidth: 0 }}>
            <Text size="H4" truncate>
              Чаты
            </Text>
          </Box>
          <Box shrink="No" alignItems="Center" gap="100">
            <IconButton
              variant="Background"
              fill="None"
              aria-label="Поиск"
              onClick={() => navigate(getHomeSearchPath())}
            >
              <Icon size="200" src={Icons.Search} />
            </IconButton>
            <IconButton
              variant="Background"
              fill="None"
              aria-pressed={!!menuAnchor}
              aria-label="Меню"
              onClick={handleOpenMenu}
            >
              <Icon size="200" src={Icons.VerticalDots} />
            </IconButton>
          </Box>
        </Box>
      </PageNavHeader>
      <PopOut
        anchor={menuAnchor}
        position="Bottom"
        align="End"
        offset={6}
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              returnFocusOnDeactivate: false,
              onDeactivate: () => setMenuAnchor(undefined),
              clickOutsideDeactivates: true,
              isKeyForward: (evt: KeyboardEvent) => evt.key === 'ArrowDown',
              isKeyBackward: (evt: KeyboardEvent) => evt.key === 'ArrowUp',
              escapeDeactivates: stopPropagation,
            }}
          >
            <HeaderMenu
              requestClose={() => setMenuAnchor(undefined)}
              openSettings={openSettings}
            />
          </FocusTrap>
        }
      />
    </>
  );
}

function HomeEmpty() {
  const navigate = useNavigate();

  return (
    <NavEmptyCenter>
      <NavEmptyLayout
        icon={<Icon size="600" src={Icons.Message} />}
        title={
          <Text size="H5" align="Center">
            Пока пусто
          </Text>
        }
        content={
          <Text size="T300" align="Center">
            Здесь появятся ваши чаты.
          </Text>
        }
        options={
          <>
            <Button
              onClick={() => navigate(getDirectCreatePath())}
              variant="Primary"
              size="300"
            >
              <Text size="B300" truncate>
                Новый чат
              </Text>
            </Button>
            <Button
              onClick={() => navigate(getHomeCreatePath())}
              variant="Secondary"
              fill="Soft"
              size="300"
            >
              <Text size="B300" truncate>
                Новая группа
              </Text>
            </Button>
          </>
        }
      />
    </NavEmptyCenter>
  );
}

export function Home() {
  const mx = useMatrixClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const directRooms = useAtomValue(mDirectAtom);
  const emptySet = useMemo(() => new Set<string>(), []);
  const rooms = useRooms(mx, allRoomsAtom, emptySet);
  const [settings, setSettings] = useState(false);

  const selectedRoomId = useSelectedRoom();
  const noRoomToDisplay = rooms.size === 0;

  const sortedRooms = useMemo(
    () => Array.from(rooms).sort(factoryRoomIdByActivity(mx)),
    [mx, rooms]
  );

  const virtualizer = useVirtualizer({
    count: sortedRooms.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  const openSettings = () => setSettings(true);
  const closeSettings = () => setSettings(false);

  return (
    <PageNav>
      <HomeHeader openSettings={openSettings} />
      {noRoomToDisplay ? (
        <HomeEmpty />
      ) : (
        <PageNavContent scrollRef={scrollRef}>
          <div
            style={{
              position: 'relative',
              height: virtualizer.getTotalSize(),
            }}
          >
            {virtualizer.getVirtualItems().map((vItem) => {
              const roomId = sortedRooms[vItem.index];
              const room = mx.getRoom(roomId);
              if (!room) return null;
              const selected = selectedRoomId === roomId;

              return (
                <VirtualTile
                  virtualItem={vItem}
                  key={vItem.index}
                  ref={virtualizer.measureElement}
                >
                  <ChatListItem
                    room={room}
                    selected={selected}
                    direct={directRooms.has(roomId)}
                    linkPath={getHomeRoomPath(getCanonicalAliasOrRoomId(mx, roomId))}
                  />
                </VirtualTile>
              );
            })}
          </div>
        </PageNavContent>
      )}
      {settings && (
        <Modal500 requestClose={closeSettings}>
          <Settings requestClose={closeSettings} />
        </Modal500>
      )}
    </PageNav>
  );
}
