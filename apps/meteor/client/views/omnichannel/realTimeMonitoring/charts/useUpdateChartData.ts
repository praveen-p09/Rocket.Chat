import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { type Chart } from 'chart.js';
import { type RefObject } from 'react';

import { updateChart } from '../../../../../app/livechat/client/lib/chartHandler';

type UseUpdateChartDataOptions = {
	context: RefObject<Chart | undefined>;
	canvas: RefObject<HTMLCanvasElement | null>;
};

export const useUpdateChartData = ({ context: contextRef, canvas: canvasRef }: UseUpdateChartDataOptions) =>
	useEffectEvent(async (label: string, data: { [x: string]: number }) => {
		if (!canvasRef?.current || !contextRef?.current) {
			return;
		}

		await updateChart(contextRef.current, label, data);
	});
