import type { IRoom } from '@rocket.chat/core-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ContextType, ReactElement } from 'react';
import React, { useMemo, memo, useEffect, useCallback } from 'react';

import { ChatSubscription } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { UserAction } from '../../../../app/ui/client/lib/UserAction';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import ImageGalleryProvider from '../../../providers/ImageGalleryProvider';
import RoomNotFound from '../RoomNotFound';
import RoomSkeleton from '../RoomSkeleton';
import { useRoomRolesManagement } from '../body/hooks/useRoomRolesManagement';
import { RoomContext } from '../contexts/RoomContext';
import ComposerPopupProvider from './ComposerPopupProvider';
import RoomToolboxProvider from './RoomToolboxProvider';
import UserCardProvider from './UserCardProvider';
import { useRedirectOnSettingsChanged } from './hooks/useRedirectOnSettingsChanged';
import { useRoomQuery } from './hooks/useRoomQuery';
import { useUsersNameChanged } from './hooks/useUsersNameChanged';
// import { useQuery } from '@tanstack/react-query';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	useRoomRolesManagement(rid);

	const { data: room, isSuccess } = useRoomQuery(rid);

	// const teamsInfoEndpoint = useEndpoint('GET', '/v1/teams.info');
	// const test = useQuery(['teamId', room?.teamId], async () => teamsInfoEndpoint({ teamId: room?.teamId }));

	// TODO: the following effect is a workaround while we don't have a general and definitive solution for it
	const router = useRouter();
	useEffect(() => {
		if (isSuccess && !room) {
			router.navigate('/home');
		}
	}, [isSuccess, room, router]);

	const subscriptionQuery = useReactiveQuery(['subscriptions', { rid }], () => ChatSubscription.findOne({ rid }) ?? null);

	useRedirectOnSettingsChanged(subscriptionQuery.data);

	useUsersNameChanged();

	const pseudoRoom = useMemo(() => {
		if (!room) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...room,
			name: roomCoordinator.getRoomName(room.t, room),
			federationOriginalName: room.name,
		};
	}, [room, subscriptionQuery.data]);

	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useReactiveValue(
		useCallback(() => {
			const { hasMore, hasMoreNext, isLoading } = RoomHistoryManager.getRoom(rid);

			return {
				hasMorePreviousMessages: hasMore.get(),
				hasMoreNextMessages: hasMoreNext.get(),
				isLoadingMoreMessages: isLoading.get(),
			};
		}, [rid]),
	);

	const context = useMemo((): ContextType<typeof RoomContext> => {
		if (!pseudoRoom) {
			return null;
		}

		return {
			rid,
			room: pseudoRoom,
			subscription: subscriptionQuery.data ?? undefined,
			hasMorePreviousMessages,
			hasMoreNextMessages,
			isLoadingMoreMessages,
		};
	}, [hasMoreNextMessages, hasMorePreviousMessages, isLoadingMoreMessages, pseudoRoom, rid, subscriptionQuery.data]);

	const isNewNavigationEnabled = useFeaturePreview('newNavigation');

	useEffect(() => {
		if (!isNewNavigationEnabled) {
			RoomManager.open(rid);
			return (): void => {
				RoomManager.back(rid);
			};
		}

		const firstLevel = (room?.prid || room?.teamId) ?? room?._id;

		if (!firstLevel) {
			return;
		}

		if (firstLevel === rid) {
			RoomManager.open(rid);
		} else {
			RoomManager.openSecondLevel(firstLevel, rid);
		}

		return (): void => {
			RoomManager.back(rid);
		};
	}, [isNewNavigationEnabled, rid, room?._id, room?.prid, room?.teamId, room?.teamMain]);

	const subscribed = !!subscriptionQuery.data;

	useEffect(() => {
		if (!subscribed) {
			return;
		}

		return UserAction.addStream(rid);
	}, [rid, subscribed]);

	if (!pseudoRoom) {
		return isSuccess && !room ? <RoomNotFound /> : <RoomSkeleton />;
	}

	return (
		<RoomContext.Provider value={context}>
			<RoomToolboxProvider>
				<ImageGalleryProvider>
					<UserCardProvider>
						<ComposerPopupProvider room={pseudoRoom}>{children}</ComposerPopupProvider>
					</UserCardProvider>
				</ImageGalleryProvider>
			</RoomToolboxProvider>
		</RoomContext.Provider>
	);
};

export default memo(RoomProvider);
